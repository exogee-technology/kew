import { TaskQueueItem } from './task-queue-item';
import { Reference } from './reference';

export interface QueueStoragePlugin {
	sync?(queue: QueueStoragePluginData): Promise<void>;
	load?(): Promise<QueueStoragePluginData>;
}

export interface QueueStoragePluginData {
	currentTasks: TaskQueueItem<any>[];
	finishedTasks: TaskQueueItem<any>[];
	references: { [key: string]: Reference<any> };
}

export interface TaskQueuePlugin {
	storage: QueueStoragePlugin;
}
