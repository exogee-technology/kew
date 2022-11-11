import { TaskQueueStorageManager } from "./task-queue-storage";
import {
  TaskQueueItem,
  TaskQueueEventEmitter,
  TaskQueueEventEmitterFilter,
  TaskQueueEventEmitterCallback,
  TaskQueueEventEmitterSubscription,
} from "./types";

/** Task Queue Event Emitter Manager */
export class TaskQueueEventEmitterManager<TH, TR> {
  protected storageManager: TaskQueueStorageManager<TH, TR>;
  protected listeners: TaskQueueEventEmitter<TH, TR>[] = [];

  constructor(storageManager: TaskQueueStorageManager<TH, TR>) {
    this.storageManager = storageManager;
  }

  /**
   * Add a listener to the manager
   * @param callback
   * @param filter
   */
  add(
    callback: TaskQueueEventEmitterCallback<TH, TR>,
    filter: TaskQueueEventEmitterFilter<TH, TR>
  ): TaskQueueEventEmitterSubscription {
    this.listeners.push({
      filter,
      callback,
    });
    return {
      remove: () => this.remove(callback),
    };
  }

  /**
   * Remove a listener from the manager
   * @param callback
   */
  remove(callback: TaskQueueEventEmitterCallback<TH, TR>): void {
    this.listeners = this.listeners.filter(
      (listener) => listener.callback === callback
    );
  }

  /**
   * Call all registered task event listeners for a given task
   * @param task
   */
  call(task: TaskQueueItem<unknown, TH, TR>): void {
    for (const listener of this.listeners) {
      if (listener.filter(task)) listener.callback(task);
    }
  }
}
