import { TaskQueueItem } from "./types";
import { TaskQueueStorageManager } from "./task-queue-storage";
import { TaskQueueEventEmitterManager } from "./task-queue-event-emitter";
import { TaskQueue } from "./task-queue";

/** Task Queue Item Context Manager */
export class TaskQueueItemContext<T, TH, TR> {
  task: TaskQueueItem<T, TH, TR>;
  storageManager: TaskQueueStorageManager<TH, TR>;
  eventEmitterManager: TaskQueueEventEmitterManager<TH, TR>;
  taskQueue: TaskQueue<TH, TR>;

  constructor(
    storageManager: TaskQueueStorageManager<TH, TR>,
    eventEmitterManager: TaskQueueEventEmitterManager<TH, TR>,
    taskQueue: TaskQueue<TH, TR>,
    task: TaskQueueItem<T, TH, TR>,
    private noEvents?: boolean
  ) {
    this.storageManager = storageManager;
    this.eventEmitterManager = eventEmitterManager;
    this.taskQueue = taskQueue;
    this.task = task;
  }

  // Update the task data
  setTaskData = async (data: T): Promise<void> => {
    this.task.data = { ...this.task.data, ...data };
    if (!this.noEvents) this.eventEmitterManager.call(this.task);
    await this.storageManager.sync();
  };

  // Change the task progress
  setProgress = async (progress: number): Promise<void> => {
    this.task.progress = progress;
    if (!this.noEvents) this.eventEmitterManager.call(this.task);
    await this.storageManager.sync();
  };

  // Create a new unique ID
  createId = (): string => {
    return ""; // @todo removing this functionality
  };

  // Return the full raw task data
  getRawTask = (): TaskQueueItem<T, TH, TR> => {
    return { ...this.task };
  };

  addTask = (
    key: Extract<keyof TH, string>,
    data: TH[typeof key]
  ): Promise<string> => {
    return this.taskQueue.add(key, data);
  };
}
