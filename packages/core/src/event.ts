import {
  Task,
  EventListener,
  EventFilter,
  EventCallback,
  EventSubscription,
} from "./types";

/** Task Queue Event Emitter Manager */
export class EventManager {
  protected listeners: EventListener[] = [];

  /**
   * Add a listener to the manager
   * @param callback
   * @param filter
   */
  add(callback: EventCallback, filter: EventFilter): EventSubscription {
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
  remove(callback: EventCallback): void {
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
