import { v4 } from 'uuid';

import { TaskQueueItem } from './types';
import { TaskQueueStorageManager } from './task-queue-storage';
import { TaskQueueEventEmitterManager } from './task-queue-event-emitter';

/** Task Queue Item Context Manager */
export class TaskQueueItemContext<T> {
	task: TaskQueueItem<T>;
	storageManager: TaskQueueStorageManager;
	listenerManager: TaskQueueEventEmitterManager;

	constructor(
		storageManager: TaskQueueStorageManager,
		listenerManager: TaskQueueEventEmitterManager,
		task: TaskQueueItem<T>
	) {
		this.storageManager = storageManager;
		this.listenerManager = listenerManager;
		this.task = task;
	}

	// Return the task context
	getContext() {
		return {
			setProgress: this.setProgress,
			createId: this.createId,
			setTaskData: this.setTaskData,
		};
	}

	// Update the task data
	setTaskData = async (data: T): Promise<void> => {
		this.task.data = data;
		this.listenerManager.call(this.task);
		await this.storageManager.sync();
	};

	// Change the task progress
	setProgress = async (progress: number): Promise<void> => {
		this.task.progress = progress;
		this.listenerManager.call(this.task);
		await this.storageManager.sync();
	};

	// Create a new unique ID
	createId = (): string => {
		return v4();
	};
}
