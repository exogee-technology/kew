import { TaskQueueItemContext } from './task-queue-item-context';

export interface TaskQueueHandlerInfo {
	name?: string;
	tags?: string[];
}

export interface TaskQueueHandler<T> {
	key(): string;
	info(taskData: T): TaskQueueHandlerInfo;
	validate?(taskData: T): void;
	create?(taskData: T, ctx: TaskQueueItemContext): Promise<void>;
	run(taskData: T, ctx: TaskQueueItemContext): Promise<void>;
	reducers?: { [key: string]: (accumulator: any, taskData: any, ctx: TaskQueueItemContext) => Promise<any> };
}

export type TaskHandlerList = { [key: string]: TaskQueueHandler<any> };
