import { TaskQueueStorageManager } from "./storage";
import {
  Task,
  TaskQueueEventEmitter,
  TaskQueueEventEmitterFilter,
  TaskQueueEventEmitterCallback,
  TaskQueueEventEmitterSubscription,
} from "./types";

/** Task Queue Event Emitter Manager */
export class TaskQueueEventEmitterManager {
  protected storageManager: TaskQueueStorageManager;
  protected listeners: TaskQueueEventEmitter[] = [];

  constructor(storageManager: TaskQueueStorageManager) {
    this.storageManager = storageManager;
  }

  /**
   * Add a listener to the manager
   * @param callback
   * @param filter
   */
  add(
    callback: TaskQueueEventEmitterCallback,
    filter: TaskQueueEventEmitterFilter,
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
  remove(callback: TaskQueueEventEmitterCallback): void {
    this.listeners = this.listeners.filter(
      (listener) => listener.callback === callback
    );
  }

  /**
   * Call all registered task event listeners for a given task
   * @param task
   */
  call(task: Task): void {
    for (const listener of this.listeners) {
      if (listener.filter(task)) listener.callback(task);
    }
  }
}
