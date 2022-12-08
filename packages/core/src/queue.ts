import {
  EventCallback,
  EventFilter,
  EventSubscription,
  ActionInterfaceCtor,
  QueueInterface,
  PlatformInterface,
  TaskStatus,
  ReducerOptions,
} from "./types";

import { PlatformManager } from "./platform";
import { Context } from "./context";
import { EventManager } from "./event";
import { createInitialTask, isSerializable, sleep } from "./util";

export enum Logging {
  NONE,
  DEBUG,
}

export interface QueueOptions {
  platform?: PlatformInterface;
  actions?: ActionInterfaceCtor<any>[];
  logging?: Logging;
}

/**
 * kew Queue Implementation
 * TActions: Actions interface
 * */
export class Queue implements QueueInterface {
  protected actions: Record<string, ActionInterfaceCtor<any>> = {};
  protected platformManager: PlatformManager;
  protected eventManager: EventManager;
  protected isRunning = false;
  protected isPaused = false;
  protected logging: Logging = Logging.NONE;

  constructor({ platform, actions, logging }: QueueOptions) {
    this.platformManager = new PlatformManager(platform);
    this.eventManager = new EventManager();

    if (Array.isArray(actions)) {
        for (const action of actions) {
            if (action.key) this.actions[action.key] = action;
        }
    }

    if (logging) this.logging = logging;
  }

  protected debugLog(message: string, data?: any) {
    if (this.logging !== Logging.DEBUG) return;
    if (data) {
      console.log("[kew]", message, data);
    } else {
      console.log("[kew]", message);
    }
  }

  public onQueueStopped: ((reason: string) => void) | undefined = undefined;
  public onQueueStarted: (() => void) | undefined = undefined;

  /**
   * Run a task immediately without adding to the queue
   * @param key - The unique key of the action to perform.
   * @param props - Any props required by the action.
   */
  async run(key: string, props: any): Promise<any> {
    // Check if an action exists with this key
    const action = this.actions[key];
    if (!action) throw new Error(`No action with key '${key}'`);

    // Create task object
    const task = createInitialTask(key, props);

    // Instantiate instance of the action
    const actionInstance = new action(task);

    // Add tags
    task.tags = actionInstance.tags();
    task.name = actionInstance.name();

    // Validate props
    actionInstance.validate();

    // Prepare the queue item
    await actionInstance.create();

    // Run the task with task data and context
    task.status = TaskStatus.IN_PROGRESS;

    await actionInstance._step("start")?.(
      new Context(this.platformManager, this.eventManager, this, task, true)
    );

    task.status = TaskStatus.FINISHED;
    task.finishedAt = Date.now();

    // Return the task props at the end
    return task.props;
  }

  /**
   * Add a new task to the queue.
   * @param key - The unique key of the action to perform.
   * @param props - Any props required by the action.
   * @returns Promise<string> A unique task ID
   * */
  async add(key: string, props: any): Promise<string> {
    // Check if an action exists with this key
    const action = this.actions[key];
    if (!action) throw new Error(`No action with key '${key}'`);

    // Create task object
    const task = createInitialTask(key, props);

    // Instantiate instance of the action
    const actionInstance = new action(task);

    // Add tags
    task.tags = actionInstance.tags();
    task.name = actionInstance.name();

    // Check that data is serializable
    if (!isSerializable(props)) throw new Error("Data must be serializable");

    // If the action has a validate method, run it to check the props
    actionInstance.validate();
    await actionInstance.create();

    // Push task on to the queue
    this.platformManager.currentTasks.push(task);
    this.debugLog(`Task ${task.id} added to queue`);

    // Persist to storage
    await this.platformManager.sync();

    // Call event listeners
    this.eventManager.call(task);

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
      const [nextTask] = this.platformManager.currentTasks;

      // If no tasks in the queue, or the queue is paused, sleep for a short moment
      if (!nextTask || this.isPaused) {
        await sleep(1000);
        continue;
      }

      this.debugLog(`Next task is ${nextTask.id}`);

      nextTask.status = TaskStatus.IN_PROGRESS;
      nextTask.attempts++;
      if (!nextTask.startedAt) nextTask.startedAt = Date.now();

      try {
        // Run the action
        const action = this.actions[nextTask.key];
        if (!action) throw new Error(`No action with key '${nextTask.key}'`);

        const actionInstance = new action(nextTask);

        await actionInstance._step("start")?.(
          new Context(
            this.platformManager,
            this.eventManager,
            this,
            nextTask,
            true
          )
        );

        // If we got here, the task completed with success
        nextTask.status = TaskStatus.FINISHED;
        nextTask.finishedAt = Date.now();
        nextTask.props = actionInstance._task.props;

        this.platformManager.finishedTasks.push(nextTask);
        this.platformManager.currentTasks.shift();
      } catch (error) {
        nextTask.lastMessage =
          error instanceof Error ? error.message : String(error);

        if (nextTask.attempts < 3) {
          // Retry a few times with exponential backoff
          const delay =
            (2 ^ nextTask.attempts) + Math.floor(Math.random() * 1000);
          await sleep(delay);
          nextTask.status = TaskStatus.QUEUED;
        } else {
          //  After three retries, stop the queue
          this.isRunning = false;
          nextTask.status = TaskStatus.FAILED;
          this.onQueueStopped?.(
            `Failed on "${nextTask.name}" - ${nextTask.lastMessage}`
          );
        }
      }

      // Persist queue
      await this.platformManager.sync();

      // Call event listeners
      this.eventManager.call(nextTask);
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
    reducerKey: string,
    initialValue?: any,
    options?: ReducerOptions
  ): Promise<any> {
    let accumulator = initialValue;

    for (const task of this.platformManager.currentTasks) {
      // Check that an action exists for this key
      const action = this.actions[task.key];
      if (!action) continue;

      const actionInstance = new action(task);
      const reducer = actionInstance._reducer(reducerKey);

      // If no reducer found, continue
      if (!reducer) continue;

      // Update the accumulator based on the reducers result.
      accumulator = await reducer(
        accumulator,
        new Context(this.platformManager, this.eventManager, this, task)
      );
    }
    return accumulator;
  }

  /**
   * Register a callback on a given filter
   * @todo add on log, on stop
   * @param filter - A filter to use on the task.
   * @param callback - A method that is called when the listener condition is triggered
   */
  on(filter: EventFilter, callback: EventCallback): EventSubscription {
    return this.eventManager.add(callback, filter);
  }

  /** Get all tasks */
  tasks() {
    return [
      ...this.platformManager.finishedTasks,
      ...this.platformManager.currentTasks,
    ];
  }

  /** Clear queue */
  async clear() {
    await this.platformManager.removeAll();
  }
}
