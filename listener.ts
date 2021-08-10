import { Task } from './types/task';
import { QueueStorageManager } from './storage';
import { TaskContext } from './task-context';
import {
	TaskEventListener,
	TaskEventListenerFilter,
	TaskEventListenerFunction,
	TaskEventListenerType,
} from './types/listener';

/**
 * Queue Listener Manager
 * Keep track of all listeners for the queue
 */
export class QueueListenerManager {
	protected storageManager: QueueStorageManager;
	protected listeners: TaskEventListener[] = [];

	constructor(storageManager: QueueStorageManager) {
		this.storageManager = storageManager;
	}

	/**
	 * Add a listener to the manager
	 * @param callback
	 * @param filter
	 */
	add(callback: TaskEventListenerFunction, filter: TaskEventListenerFilter) {
		this.listeners.push({
			filter,
			callback,
		});
	}

	/**
	 * Remove a listener from the manager
	 * @param callback
	 */
	remove(callback: TaskEventListenerFunction) {
		this.listeners = this.listeners.filter((listener) => listener.callback === callback);
	}

	/**
	 * Call all registered task event listeners for a given task
	 * @param task
	 */
	call(task: Task<any>) {
		for (const listener of this.listeners) {
			if (
				listener.filter.listenerType === TaskEventListenerType.ALL ||
				(listener.filter.listenerType === TaskEventListenerType.TASK_ID &&
					listener.filter.id &&
					task.id === listener.filter.id) ||
				(listener.filter.listenerType === TaskEventListenerType.TASK_TAG &&
					task.info.tags &&
					listener.filter.tag &&
					task.info.tags.includes(listener.filter.tag)) ||
				(listener.filter.listenerType === TaskEventListenerType.CUSTOM &&
					listener.filter.custom &&
					listener.filter.custom(task))
			) {
				listener.callback(task, new TaskContext(this.storageManager, this, task));
			}
		}
	}
}
