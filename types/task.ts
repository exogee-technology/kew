import { TaskHandlerInfo } from './task-handler';

/**
 * An individual task object.
 * All fields should be kept serializable.
 */
export interface Task<T> {
	id: string;
	taskData?: T;
	taskType: string;
	taskState: TaskState;
	progress: number;
	lastMessage?: TaskResultMessage;
	date: number;
	info: TaskHandlerInfo;
}

/**
 * The current state of the task
 */
export enum TaskState {
	QUEUED,
	IN_PROGRESS,
	DELAYED,
	UNKNOWN,
	FINISHED,
}

/**
 * Tuple returned by a task when it finishes, includes a result and a message string
 */
export type TaskResult = [TaskResultStatus, TaskResultMessage?];
export type TaskResultMessage = string | null | undefined;
export enum TaskResultStatus {
	ERROR = -3,
	QUEUE_ALREADY_RUNNING = -2,
	UNKNOWN = -1,
	COMPLETED,
	QUEUE_EMPTY,
	IS_OFFLINE,
	QUEUE_STOPPED,
}

export type TaskReducerFunction = (handlerType: string, data: any) => any;
