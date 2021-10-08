import { TaskQueueHandlerInfo } from './task-queue-handler';

/**
 * An individual task object.
 * All fields must be serializable.
 */
export interface TaskQueueItem<T> {
	id: string;
	data?: T | undefined;
	key: string;
	status: TaskQueueItemStatus;
	progress: number;
	attempts: number;
	lastMessage?: string;
	submittedAt: number; /** Submitted to queue timestamp */
	startedAt?: number; /** Started working on task timestamp */
	finishedAt?: number; /** Finished working on task timestamp */
	info: TaskQueueHandlerInfo;
}

/** The current status of a task */
export enum TaskQueueItemStatus {
	FAILED = -1,
	QUEUED,
	IN_PROGRESS,
	FINISHED,
}

/** Error returned by task queue */
export class TaskQueueItemError extends Error {
	fatalError: boolean
	constructor(message: string, fatalError: boolean) {
		super(message)
		this.fatalError = fatalError;
	}
}

