import {
	QueueAddOptions,
	QueuePlugin,
	QueueRunFailureMode,
	QueueRunOptions,
	Task,
	TaskEventListenerFilter,
	TaskEventListenerFunction,
	TaskHandler,
	TaskHandlerList,
	TaskReducerFunction,
	TaskResult,
	TaskResultStatus,
	TaskState,
} from './types';

import { QueueStorageManager } from './storage';
import { TaskContext } from './task-context';
import { QueueListenerManager } from './listener';
import { createInitialTask, isSerializable, sleep } from './util';

/**
 * Task Queue Implementation
 */
export class TaskQueue {
	protected taskHandlers: TaskHandlerList = {};
	protected storageManager = new QueueStorageManager();
	protected listenerManager = new QueueListenerManager(this.storageManager);
	protected isOffline: boolean = false;
	protected isRunning: boolean = false;

	/**
	 * Run a task immediately without adding to the queue
	 * @param taskType - A string that represents the type of task to perform.
	 * @param taskData - Any data items required by the task handler.
	 */
	async runTaskNow(taskType: string, taskData?: any): Promise<void> {
		// Check if a registered handler exists for this task type
		const registeredHandler = this.taskHandlers[taskType];
		if (!registeredHandler) throw new Error(`No registered task type with name '${taskType}'`);

		// If the handler has a validateTask method, run it to check the taskData
		if (registeredHandler.validate) await registeredHandler.validate(taskData);

		// Create task object
		const task = createInitialTask(taskType, taskData, await registeredHandler.info(taskData));

		// If the handler has a create method, run it to prepare the queue item
		if (registeredHandler.create)
			await registeredHandler.create(
				task.taskData,
				new TaskContext(this.storageManager, this.listenerManager, task)
			);

		// Run the task with task data and context
		task.taskState = TaskState.IN_PROGRESS;
		return registeredHandler.run(
			task.taskData,
			new TaskContext(this.storageManager, this.listenerManager, task)
		);
	}

	/**
	 * Add a new task to the queue.
	 * @param taskType - A string that represents the type of task to perform.
	 * @param taskData - Any data items required by the task handler
	 * @param opts - Queue Options
	 * @returns A Unique Task ID
	 * */
	async addTask(taskType: string, taskData?: any, opts?: QueueAddOptions): Promise<string> {
		// Check if a registered handler exists for this task type
		const registeredHandler = this.taskHandlers[taskType];
		if (!registeredHandler) throw new Error(`No registered task type with name '${taskType}'`);

		// Check that data is serializable
		if (!opts?.ignoreUnserializableData && !isSerializable(taskData))
			throw new Error('Data must be serializable');

		// If the handler has a validateTask method, run it to check the taskData
		if (registeredHandler.validate && !opts?.ignoreValidation)
			await registeredHandler.validate(taskData);

		// Create task object
		const task = createInitialTask(taskType, taskData, await registeredHandler.info(taskData));

		// Push task on to the queue
		this.storageManager.currentTasks.push(task);

		// If the handler has a create method, run it to prepare the queue item
		if (registeredHandler.create)
			await registeredHandler.create(
				taskData,
				new TaskContext(this.storageManager, this.listenerManager, task)
			);

		// Persist to storage
		await this.storageManager.sync();

		// Call event listeners
		this.listenerManager.call(task);

		// Return the generated task ID
		return task.id;
	}

	/**
	 * Run all tasks as per provided options object- by default, will stop on task failure.
	 */
	async runQueue(
		opts: QueueRunOptions = {
			failureMode: QueueRunFailureMode.RETRY,
		}
	): Promise<TaskResult> {
		if (this.isRunning) return [TaskResultStatus.QUEUE_ALREADY_RUNNING];
		this.isRunning = true;

		while (this.isRunning) {
			const [result, message] = await this.runNextTask();

			// If the task didn't complete, and the failure mode is STOP, we should stop execution now
			if (result !== TaskResultStatus.COMPLETED && opts.failureMode === QueueRunFailureMode.STOP) {
				this.isRunning = false;
				return [result, message];
			}

			switch (result) {
				case TaskResultStatus.COMPLETED:
					break;

				case TaskResultStatus.QUEUE_EMPTY:
				case TaskResultStatus.IS_OFFLINE:
					await sleep(1000);
					break;

				case TaskResultStatus.ERROR:
					await sleep(5000);
					break;

				case TaskResultStatus.UNKNOWN:
					this.isRunning = false;
					return [result, message];
			}
		}
		return [TaskResultStatus.QUEUE_STOPPED];
	}

	/**
	 * Stop a currently running queue
	 */
	stopQueue() {
		this.isRunning = false;
	}

	/**
	 * Run only the next task in the queue.
	 */
	async runNextTask(): Promise<TaskResult> {
		// If no tasks in the queue, return queue is empty
		if (
			!this.storageManager.currentTasks ||
			!Array.isArray(this.storageManager.currentTasks) ||
			this.storageManager.currentTasks.length < 1
		)
			return [TaskResultStatus.QUEUE_EMPTY];

		// If the queue is offline, return offline
		if (this.isOffline) return [TaskResultStatus.IS_OFFLINE];

		// Pull in the next task and update status
		const [nextTask] = this.storageManager.currentTasks;
		nextTask.taskState = TaskState.IN_PROGRESS;

		// Run the task and get the result
		const [result, message] = await this.runTask(nextTask);

		if (result === TaskResultStatus.COMPLETED) {
			// If Task is completed, update message, push to finishedTasks, shift off of currentTasks
			nextTask.lastMessage = message;
			nextTask.taskState = TaskState.FINISHED;
			this.storageManager.finishedTasks.push(nextTask);
			this.storageManager.currentTasks.shift();

			// Persist queue
			await this.storageManager.sync();

			// Call event listeners
			this.listenerManager.call(nextTask);

			// Return result
			return [TaskResultStatus.COMPLETED, message];
		}

		if (result === TaskResultStatus.ERROR) {
			// If Task is not completed, update status and message
			nextTask.lastMessage = message;
			nextTask.taskState = TaskState.DELAYED;

			// Persist queue
			await this.storageManager.sync();

			// Call event listeners
			this.listenerManager.call(nextTask);

			// Return result
			return [TaskResultStatus.ERROR, message];
		}

		return [TaskResultStatus.UNKNOWN];
	}

	/**
	 * Run a specific task, providing a task object.
	 * @param task - A task object
	 */
	protected async runTask(task: Task<any>): Promise<TaskResult> {
		try {
			// Check taskType has a registered handler
			const registeredHandler = this.taskHandlers[task.taskType];
			if (!registeredHandler) return [TaskResultStatus.ERROR, 'No Registered Handler for Task'];

			// Run the task with task data and context
			await registeredHandler.run(
				task.taskData,
				new TaskContext(this.storageManager, this.listenerManager, task)
			);

			// Return success result
			return [TaskResultStatus.COMPLETED, null];
		} catch (e) {
			// Catch any errors and return ERROR result
			return [TaskResultStatus.ERROR, e.message];
		}
	}

	/**
	 * Run a reduce over the queue
	 * @param taskReducer: A named reducer string, or a custom function to run over each task.
	 * @param init: The initial value to use as the accumulator.
	 */
	async runReducer(taskReducer: string | TaskReducerFunction, init?: any): Promise<any> {
		let accumulator = init;
		for (const task of this.storageManager.currentTasks) {
			// Check task has a taskType and registered handler
			const registeredHandler = this.taskHandlers[task.taskType];

			// Update the accumulator based on the reducers result.
			if (typeof taskReducer === 'function') {
				accumulator = await taskReducer(task.taskType, task.taskData);
			} else {
				if (registeredHandler?.reducers && registeredHandler.reducers[taskReducer]) {
					accumulator = await registeredHandler.reducers[taskReducer](
						accumulator,
						task.taskData,
						new TaskContext(this.storageManager, this.listenerManager, task).getContext()
					);
				}
			}
		}
		return accumulator;
	}

	/**
	 * Attach a new plugin to the queue
	 * @param plugin - A Queue Plugin interface
	 */
	addPlugin(plugin: QueuePlugin) {
		(async () => {
			if (plugin.storage) await this.storageManager.use(plugin.storage);
		})();
	}

	/**
	 * Set online/offline mode- offline mode prevents tasks from starting.
	 * @param value - true if the mode should be online, or false if the mode should be offline.
	 */
	setOffline(value: boolean) {
		this.isOffline = value;
	}

	/**
	 * Register a new task handler.
	 * @param type - A string that represents the type of task to perform.
	 * @param handler - A task handler object.
	 */
	addHandler(type: string, handler: TaskHandler<any>) {
		this.taskHandlers[type] = handler;
	}

	/**
	 * Register a new listener.
	 * @param callback - A method that is called when the listener condition is triggered
	 * @param filter - A filter to use on the task.
	 */
	addListener(callback: TaskEventListenerFunction, filter: TaskEventListenerFilter) {
		this.listenerManager.add(callback, filter);
	}

	/**
	 * Unregister a listener
	 * @param callback - The function callback registered to the listener.
	 */
	removeListener(callback: TaskEventListenerFunction) {
		this.listenerManager.remove(callback);
	}

	/**
	 * Get all current tasks.
	 */
	getCurrentTasks() {
		return this.storageManager.currentTasks;
	}

	/**
	 * Get all finished tasks.
	 */
	getCompletedTasks() {
		return this.storageManager.finishedTasks;
	}

	/**
	 * Get all current or finished tasks.
	 */
	getAllTasks() {
		return [...this.storageManager.currentTasks, ...this.storageManager.finishedTasks];
	}

	/**
	 * Get all currently stored references
	 */
	getReferences() {
		return this.storageManager.references;
	}

	/**
	 * Remove all stored queues and references.
	 */
	async removeAllTasks() {
		await this.storageManager.removeAll();
	}
}
