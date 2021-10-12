"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskQueueEventEmitterManager = void 0;
/** Task Queue Event Emitter Manager */
class TaskQueueEventEmitterManager {
    constructor(storageManager) {
        this.listeners = [];
        this.storageManager = storageManager;
    }
    /**
     * Add a listener to the manager
     * @param callback
     * @param filter
     */
    add(callback, filter) {
        this.listeners.push({
            filter,
            callback,
        });
        return {
            remove: () => this.remove(callback)
        };
    }
    /**
     * Remove a listener from the manager
     * @param callback
     */
    remove(callback) {
        this.listeners = this.listeners.filter((listener) => listener.callback === callback);
    }
    /**
     * Call all registered task event listeners for a given task
     * @param task
     */
    call(task) {
        for (const listener of this.listeners) {
            if (listener.filter(task))
                listener.callback(task);
        }
    }
}
exports.TaskQueueEventEmitterManager = TaskQueueEventEmitterManager;
