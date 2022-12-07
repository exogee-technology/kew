import {
  MapOfActions,
  TaskQueueEventEmitterCallback,
  TaskQueueEventEmitterFilter,
  TaskQueueEventEmitterSubscription,
  Action,
  TaskQueueInterface,
  TaskQueuePlugin,
  TaskStatus,
  KewReducerOptions,
} from "./types";

import { TaskQueueStorageManager } from "./storage";
import { TaskQueueItemContext } from "./context";
import { TaskQueueEventEmitterManager } from "./event-emitter";
import { createInitialTask, isSerializable, sleep } from "./util";

export interface TaskQueueCreateOptions {
  plugins?: TaskQueuePlugin[];
  actions?: Action[];
}

/** Convenience helper to create a new task queue with plugins and actions */
export const createTaskQueue = ({
  plugins,
  actions,
}: TaskQueueCreateOptions) => {
  const queue = new TaskQueue();
  plugins && queue.plugins(...plugins);
  actions && queue.addActions(...actions);
  return queue;
};

/**
 * kew Queue Implementation
 * TActions: Actions interface
 * */
export class TaskQueue implements TaskQueueInterface {
  protected actions: MapOfActions = {};
  protected storageManager = new TaskQueueStorageManager();
  protected listenerManager = new TaskQueueEventEmitterManager(
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
   * @param key - The unique key of the action to perform.
   * @param props - Any props required by the action.
   */
  async run(
    key: string,
    props: any,
  ): Promise<any> {
    // Check if an action exists with this key
    const action = this.actions[key];
    if (!action) throw new Error(`No action with key '${key}'`);

    // If the action has a validate method, run it to check the props
    if (action.validate) action.validate(props);

    // Create task object
    const task = createInitialTask(
      key,
      action.metadata?.(props),
      props
    );

    // If the action has a create method, run it to prepare the queue item
    if (action.create)
      await action.create(
              task.props,
        new TaskQueueItemContext(
          this.storageManager,
          this.listenerManager,
          this,
          task
        )
      );

    // Run the task with task data and context
    task.status = TaskStatus.IN_PROGRESS;
    await action.run(
      task.props,
      new TaskQueueItemContext(
        this.storageManager,
        this.listenerManager,
        this,
        task,
        true
      )
    );

    // Return the task props at the end
      return task.props;
  }

  /**
   * Add a new task to the queue.
   * @param key - The unique key of the action to perform.
   * @param props - Any props required by the action.
   * @returns Promise<string> A unique task ID
   * */
  async add(
    key: string,
    props: any
  ): Promise<string> {
    // Check if an action exists with this key
    const action = this.actions[key];
    if (!action) throw new Error(`No action with key '${key}'`);

    // Check that data is serializable
    if (!isSerializable(props)) throw new Error("Data must be serializable");

    // If the action has a validate method, run it to check the props
    if (action.validate) action.validate(props);

    // Create task object
    const task = createInitialTask(
      key,
      action.metadata?.(props),
      props
    );

    // Push task on to the queue
    this.storageManager.currentTasks.push(task);
    this.log(`Task ${task.id} added to queue`);

    // If the handler has a create method, run it to prepare the queue item
    if (action.create)
      await action.create(
              task.props,
        new TaskQueueItemContext(
          this.storageManager,
          this.listenerManager,
          this,
          task
        )
      );

    // Persist to storage
    await this.storageManager.sync();

    // Call event listeners
    this.listenerManager.call(task);

    // Return the generated task ID
    return task.id;
  }

  /** Run all tasks in the queue */
  async start(): Promise<void> {
    if (this.isRunning) throw new Error("Queue is already running");
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

        nextTask.status = TaskStatus.IN_PROGRESS;
      nextTask.attempts++;
      if (!nextTask.startedAt) nextTask.startedAt = Date.now();

      try {
        // Run the action
        let action = this.actions[nextTask.key];
        if (!action) throw new Error(`No action with key '${nextTask.key}'`);

        await action.run(
          nextTask.props,
          new TaskQueueItemContext(
            this.storageManager,
            this.listenerManager,
            this,
            nextTask
          )
        );

        // If we got here, the task completed with success
          nextTask.status = TaskStatus.FINISHED;
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
          nextTask.status = TaskStatus.QUEUED;
        } else {
          // For permanent failure, unknown failures, and after three retries, stop the queue
          this.isRunning = false;
          nextTask.status = TaskStatus.FAILED;
          this.onQueueStopped?.(
            `Failed on "${nextTask.metadata.name}" - ${nextTask.lastMessage}`
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
   * @param key: A named reducer string.
   * @param initialValue: The initial value to use as the accumulator.
   * @param opts: Reducer Options
   */
  async reducer(
    key: string,
    initialValue?: any,
    opts?: KewReducerOptions
  ): Promise<any> {
    let accumulator = initialValue;

    for (const task of this.storageManager.currentTasks) {
      // Check that an action exists for this key
      const reducer = this.actions[task.key]?.reducers?.[key];

      // If no reducer found, continue
      if (!reducer) continue;

      // Update the accumulator based on the reducers result.
      accumulator = await reducer(
        accumulator,
        task.props,
        new TaskQueueItemContext(
          this.storageManager,
          this.listenerManager,
          this,
          task
        )
      );
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
   * Register one or more new actions
   * @param actions: One or more actions
   */
  addActions(...actions: Action[]) {
    for (const action of actions) {
      const key = action.key();
      // @ts-ignore @todo
      this.actions[key] = action;
    }
  }

  /**
   * Register a callback on a given filter
   * @todo add on log, on stop
   * @param filter - A filter to use on the task.
   * @param callback - A method that is called when the listener condition is triggered
   */
  on(
    filter: TaskQueueEventEmitterFilter,
    callback: TaskQueueEventEmitterCallback
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
