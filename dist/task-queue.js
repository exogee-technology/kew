"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskQueue = exports.createTaskQueue = void 0;
const types_1 = require("./types");
const task_queue_storage_1 = require("./task-queue-storage");
const task_queue_item_context_1 = require("./task-queue-item-context");
const task_queue_event_emitter_1 = require("./task-queue-event-emitter");
const util_1 = require("./util");
/** Convenience helper to create a new task queue with plugins and handlers */
const createTaskQueue = ({ plugins, handlers, }) => {
    const queue = new TaskQueue();
    plugins && queue.plugins(...plugins);
    handlers && queue.handlers(...handlers);
    return queue;
};
exports.createTaskQueue = createTaskQueue;
/**
 * kew  Queue Implementation
 * TH: Task Queue Handlers interface
 * TR: Task Queue Reducers interface
 * */
class TaskQueue {
    constructor() {
        this.taskHandlers = {};
        this.storageManager = new task_queue_storage_1.TaskQueueStorageManager();
        this.listenerManager = new task_queue_event_emitter_1.TaskQueueEventEmitterManager(this.storageManager);
        this.isRunning = false;
        this.isPaused = false;
        this.onQueueStopped = undefined;
        this.onQueueStarted = undefined;
    }
    log(message, data) {
        console.log("kew: ", message, data);
    }
    /**
     * Run a task immediately without adding to the queue
     * @param key - A string that represents the type of task to perform.
     * @param data - Any data items required by the task handler.
     */
    async run(key, data) {
        // Check if a registered handler exists for this task type
        const registeredHandler = this.taskHandlers[key];
        if (!registeredHandler)
            throw new Error(`No registered task queue handler with key '${key}'`);
        // If the handler has a validateTask method, run it to check the taskData
        if (registeredHandler.validate)
            registeredHandler.validate(data);
        // Create task object
        const task = util_1.createInitialTask(key, registeredHandler.info(data), data);
        // If the handler has a create method, run it to prepare the queue item
        if (registeredHandler.create)
            await registeredHandler.create(task.data, new task_queue_item_context_1.TaskQueueItemContext(this.storageManager, this.listenerManager, this, task));
        // Run the task with task data and context
        task.status = types_1.TaskQueueItemStatus.IN_PROGRESS;
        await registeredHandler.run(task.data, new task_queue_item_context_1.TaskQueueItemContext(this.storageManager, this.listenerManager, this, task, true));
        // Return the task data at the end
        return task.data;
    }
    /**
     * Add a new task to the queue.
     * @param key - A string that represents the type of handler to use.
     * @param data - Any data items required by the handler.
     * @returns Promise<string> A Unique Task ID
     * */
    async add(key, data) {
        // Check if a registered handler exists for this task type
        const registeredHandler = this.taskHandlers[key];
        if (!registeredHandler)
            throw new Error(`No registered task queue handler with key '${key}'`);
        this.log("A handler with this key does exist");
        // Check that data is serializable
        if (!util_1.isSerializable(data))
            throw new Error("Data must be serializable");
        this.log("Data is serializable");
        // If the handler has a validate method, run it to check the taskData
        if (registeredHandler.validate)
            registeredHandler.validate(data);
        this.log("Data validated OK");
        // Create task object
        const task = util_1.createInitialTask(key, registeredHandler.info(data), data);
        this.log("Task created", task);
        // Push task on to the queue
        this.storageManager.currentTasks.push(task);
        this.log("Task added to queue");
        // If the handler has a create method, run it to prepare the queue item
        if (registeredHandler.create)
            await registeredHandler.create(data, new task_queue_item_context_1.TaskQueueItemContext(this.storageManager, this.listenerManager, this, task));
        this.log("Task prepared");
        // Persist to storage
        await this.storageManager.sync();
        this.log("Storage synced");
        // Call event listeners
        this.listenerManager.call(task);
        this.log("Listeners called");
        // Return the generated task ID
        return task.id;
    }
    /** Run all tasks in the queue */
    async start() {
        if (this.isRunning)
            throw new Error("Task Queue is already running");
        this.isRunning = true;
        this.onQueueStarted?.();
        while (this.isRunning) {
            // Pull in the next task and update status
            const [nextTask] = this.storageManager.currentTasks;
            // If no tasks in the queue, or the queue is paused, sleep for a short moment
            if (!nextTask || this.isPaused) {
                await util_1.sleep(1000);
                continue;
            }
            nextTask.status = types_1.TaskQueueItemStatus.IN_PROGRESS;
            nextTask.attempts++;
            if (!nextTask.startedAt)
                nextTask.startedAt = Date.now();
            try {
                // Run the task with task data and context
                if (!this.taskHandlers[nextTask.key])
                    throw new Error(`No registered task queue handler with key '${nextTask.key}'`);
                await this.taskHandlers[nextTask.key]?.run(nextTask.data, new task_queue_item_context_1.TaskQueueItemContext(this.storageManager, this.listenerManager, this, nextTask));
                // If we got here, the task completed with success
                nextTask.status = types_1.TaskQueueItemStatus.FINISHED;
                nextTask.finishedAt = Date.now();
                this.storageManager.finishedTasks.push(nextTask);
                this.storageManager.currentTasks.shift();
            }
            catch (e) {
                nextTask.lastMessage = e.message;
                if (!e.fatalError && nextTask.attempts < 3) {
                    // For temporary failure, retry a few times with exponential backoff
                    const delay = (2 ^ nextTask.attempts) + Math.floor(Math.random() * 1000);
                    await util_1.sleep(delay);
                    nextTask.status = types_1.TaskQueueItemStatus.QUEUED;
                }
                else {
                    // For permanent failure, unknown failures, and after three retries, stop the queue
                    this.isRunning = false;
                    nextTask.status = types_1.TaskQueueItemStatus.FAILED;
                    this.onQueueStopped?.(`Failed on "${nextTask.info.name}" - ${nextTask.lastMessage}`);
                }
            }
            // Persist queue
            await this.storageManager.sync();
            // Call event listeners
            this.listenerManager.call(nextTask);
        }
    }
    /** Stop a currently running queue */
    stop() {
        this.onQueueStopped?.(`Manually stopped queue`);
        this.isRunning = false;
    }
    pause() {
        this.isPaused = true;
    }
    resume() {
        this.isPaused = false;
    }
    /**
     * Run a reducer over the queue
     * @param key: A named reducer string, or a custom function to run over each task.
     * @param initialValue: The initial value to use as the accumulator.
     * @param opts: Reducer Options
     */
    async reducer(key, initialValue, opts) {
        let accumulator = initialValue;
        for (const task of this.storageManager.currentTasks) {
            // Check task has a taskType and registered handler
            const registeredHandler = this.taskHandlers[task.key];
            // Update the accumulator based on the reducers result.
            if (registeredHandler?.reducers && registeredHandler.reducers[key]) {
                accumulator = await registeredHandler.reducers[key](accumulator, task.data, new task_queue_item_context_1.TaskQueueItemContext(this.storageManager, this.listenerManager, this, task));
            }
        }
        return accumulator;
    }
    /**
     * Attach a new plugin to the queue
     * @param plugins - One or more plugins
     */
    plugins(...plugins) {
        for (const plugin of plugins) {
            (async () => {
                if (plugin.storage)
                    await this.storageManager.use(plugin.storage);
            })();
        }
    }
    /**
     * Register a new task handler.
     * @param handlers - One or more task handlers
     */
    handlers(...handlers) {
        for (const handler of handlers) {
            const key = handler.key();
            // @ts-ignore @todo
            this.taskHandlers[key] = handler;
        }
    }
    /**
     * Register a callback on a given filter
     * @todo add on log, on stop
     * @param filter - A filter to use on the task.
     * @param callback - A method that is called when the listener condition is triggered
     */
    on(filter, callback) {
        return this.listenerManager.add(callback, filter);
    }
    /** Get all tasks */
    tasks() {
        return [
            ...this.storageManager.finishedTasks,
            ...this.storageManager.currentTasks,
        ];
    }
    /** Clear queue */
    async clear() {
        await this.storageManager.removeAll();
    }
}
exports.TaskQueue = TaskQueue;
