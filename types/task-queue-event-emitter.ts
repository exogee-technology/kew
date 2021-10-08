import { TaskQueueItem } from './task-queue-item';

export type TaskQueueEventEmitterFilter = (task: TaskQueueItem<unknown>) => boolean;
export type TaskQueueEventEmitterCallback = (task: TaskQueueItem<unknown>) => void;

export interface TaskQueueEventEmitter {
	callback: TaskQueueEventEmitterCallback;
	filter: TaskQueueEventEmitterFilter;
}

export interface TaskQueueEventEmitterSubscription {
	remove: () => void;
}