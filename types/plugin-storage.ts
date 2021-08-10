import { Task } from './task';
import { Reference } from './reference';

export interface QueueStoragePlugin {
	sync?(queue: QueueStoragePluginData): Promise<void>;
	load?(): Promise<QueueStoragePluginData>;
}

export interface QueueStoragePluginData {
	currentTasks: Task<any>[];
	finishedTasks: Task<any>[];
	references: { [key: string]: Reference<any> };
}
