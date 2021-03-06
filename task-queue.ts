import {
  TaskHandlerList,
  TaskQueueEventEmitterCallback,
  TaskQueueEventEmitterFilter,
  TaskQueueEventEmitterSubscription,
  TaskQueueHandler,
  TaskQueueInterface,
  TaskQueuePlugin,
  TaskQueueItemStatus,
  TaskQueueHandlerKey,
  KewReducerOptions,
} from "./types";

import { TaskQueueStorageManager } from "./task-queue-storage";
import { TaskQueueItemContext } from "./task-queue-item-context";
import { TaskQueueEventEmitterManager } from "./task-queue-event-emitter";
import { createInitialTask, isSerializable, sleep } from "./util";

export interface TaskQueueCreateOptions<TH, TR> {
  plugins?: TaskQueuePlugin[];
  handlers?: TaskQueueHandler<any>[];
}

/** Convenience helper to create a new task queue with plugins and handlers */
export const createTaskQueue = <TH = {}, TR = {}>({
  plugins,
  handlers,
}: TaskQueueCreateOptions<TH, TR>) => {
  const queue = new TaskQueue<TH, TR>();
  plugins && queue.plugins(...plugins);
  handlers && queue.handlers(...handlers);
  return queue;
};

/**
 * kew  Queue Implementation
 * TH: Task Queue Handlers interface
 * TR: Task Queue Reducers interface
 * */
export class TaskQueue<TH = {}, TR = {}> implements TaskQueueInterface<TH, TR> {
  protected taskHandlers: TaskHandlerList<TH, TR> = {};
  protected storageManager = new TaskQueueStorageManager<TH, TR>();
  protected listenerManager = new TaskQueueEventEmitterManager<TH, TR>(
    this.storageManager
  );
  protected isRunning = false;
  protected isPaused = false;

  protected log(message: string, data?: any) {
    console.log("kew: ", message, data);
  }

  public onQueueStopped: ((reason: string) => void) | undefined = undefined;
  public onQueueStarted: (() => void) | undefined = undefined;

  /**
   * Run a task immediately without adding to the queue
   * @param key - A string that represents the type of task to perform.
   * @param data - Any data items required by the task handler.
   */
  async run(
    key: TaskQueueHandlerKey<TH>,
    data: TH[typeof key]
  ): Promise<TH[typeof key] | undefined> {
    // Check if a registered handler exists for this task type
    const registeredHandler = this.taskHandlers[key];
    if (!registeredHandler)
      throw new Error(`No registered task queue handler with key '${key}'`);

    // If the handler has a validateTask method, run it to check the taskData
    if (registeredHandler.validate) registeredHandler.validate(data);

    // Create task object
    const task = createInitialTask<TH, TR>(
      key,
      registeredHandler.info(data),
      data
    );

    // If the handler has a create method, run it to prepare the queue item
    if (registeredHandler.create)
      await registeredHandler.create(
        task.data,
        new TaskQueueItemContext<TH[typeof key], TH, TR>(
          this.storageManager,
          this.listenerManager,
          this,
          task
        )
      );

    // Run the task with task data and context
    task.status = TaskQueueItemStatus.IN_PROGRESS;
    await registeredHandler.run(
      task.data,
      new TaskQueueItemContext<TH[typeof key], TH, TR>(
        this.storageManager,
        this.listenerManager,
        this,
        task,
        true
      )
    );

    // Return the task data at the end
    return task.data;
  }

  /**
   * Add a new task to the queue.
   * @param key - A string that represents the type of handler to use.
   * @param data - Any data items required by the handler.
   * @returns Promise<string> A Unique Task ID
   * */
  async add(
    key: TaskQueueHandlerKey<TH>,
    data: TH[typeof key]
  ): Promise<string> {
    // Check if a registered handler exists for this task type
    const registeredHandler = this.taskHandlers[key];
    if (!registeredHandler)
      throw new Error(`No registered task queue handler with key '${key}'`);
    this.log("A handler with this key does exist");

    // Check that data is serializable
    if (!isSerializable(data)) throw new Error("Data must be serializable");
    this.log("Data is serializable");

    // If the handler has a validate method, run it to check the taskData
    if (registeredHandler.validate) registeredHandler.validate(data);
    this.log("Data validated OK");

    // Create task object
    const task = createInitialTask<TH, TR>(
      key,
      registeredHandler.info(data),
      data
    );
    this.log("Task created", task);

    // Push task on to the queue
    this.storageManager.currentTasks.push(task);
    this.log("Task added to queue");

    // If the handler has a create method, run it to prepare the queue item
    if (registeredHandler.create)
      await registeredHandler.create(
        data,
        new TaskQueueItemContext<TH[typeof key], TH, TR>(
          this.storageManager,
          this.listenerManager,
          this,
          task
        )
      );
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
  async start(): Promise<void> {
    if (this.isRunning) throw new Error("Task Queue is already running");
    this.isRunning = true;

    this.onQueueStarted?.();

    while (this.isRunning) {
      // Pull in the next task and update status
      const [nextTask] = this.storageManager.currentTasks;

      // If no tasks in the queue, or the queue is paused, sleep for a short moment
      if (!nextTask || this.isPaused) {
        await sleep(1000);
        continue;
      }

      nextTask.status = TaskQueueItemStatus.IN_PROGRESS;
      nextTask.attempts++;
      if (!nextTask.startedAt) nextTask.startedAt = Date.now();

      try {
        // Run the task with task data and context
        if (!this.taskHandlers[nextTask.key])
          throw new Error(
            `No registered task queue handler with key '${nextTask.key}'`
          );

        await this.taskHandlers[nextTask.key]?.run(
          nextTask.data,
          new TaskQueueItemContext(
            this.storageManager,
            this.listenerManager,
            this,
            nextTask
          )
        );

        // If we got here, the task completed with success
        nextTask.status = TaskQueueItemStatus.FINISHED;
        nextTask.finishedAt = Date.now();
        this.storageManager.finishedTasks.push(nextTask);
        this.storageManager.currentTasks.shift();
      } catch (e) {
        nextTask.lastMessage = e.message;

        if (!e.fatalError && nextTask.attempts < 3) {
          // For temporary failure, retry a few times with exponential backoff
          const delay =
            (2 ^ nextTask.attempts) + Math.floor(Math.random() * 1000);
          await sleep(delay);
          nextTask.status = TaskQueueItemStatus.QUEUED;
        } else {
          // For permanent failure, unknown failures, and after three retries, stop the queue
          this.isRunning = false;
          nextTask.status = TaskQueueItemStatus.FAILED;
          this.onQueueStopped?.(
            `Failed on "${nextTask.info.name}" - ${nextTask.lastMessage}`
          );
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
  async reducer(
    key: Extract<keyof TR, string>,
    initialValue?: TR[typeof key],
    opts?: KewReducerOptions<TR[typeof key], TH, TR>
  ): Promise<TR[typeof key] | undefined> {
    let accumulator = initialValue;

    for (const task of this.storageManager.currentTasks) {
      // Check task has a taskType and registered handler
      const registeredHandler = this.taskHandlers[task.key];

      // Update the accumulator based on the reducers result.
      if (registeredHandler?.reducers && registeredHandler.reducers[key]) {
        accumulator = await registeredHandler.reducers[key](
          accumulator,
          task.data,
          new TaskQueueItemContext(
            this.storageManager,
            this.listenerManager,
            this,
            task
          )
        );
      }
    }
    return accumulator;
  }

  /**
   * Attach a new plugin to the queue
   * @param plugins - One or more plugins
   */
  plugins(...plugins: TaskQueuePlugin[]) {
    for (const plugin of plugins) {
      (async () => {
        if (plugin.storage) await this.storageManager.use(plugin.storage);
      })();
    }
  }

  /**
   * Register a new task handler.
   * @param handlers - One or more task handlers
   */
  handlers(...handlers: TaskQueueHandler<any>[]) {
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
  on(
    filter: TaskQueueEventEmitterFilter<TH, TR>,
    callback: TaskQueueEventEmitterCallback<TH, TR>
  ): TaskQueueEventEmitterSubscription {
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
