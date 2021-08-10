import { TaskContext } from './task-context';

export interface TaskHandlerInfo {
	friendlyName?: string;
	tags?: string[];
}

export interface TaskHandler<T> {
	info(taskData: T): Promise<TaskHandlerInfo>;
	validate?(taskData: T): Promise<void>;
	create?(taskData: T, ctx: TaskContext): Promise<void>;
	run(taskData: T, ctx: TaskContext): Promise<void>;
	reducers?: { [key: string]: (accumulator: any, taskData: any, ctx: TaskContext) => Promise<any> };
}

export type TaskHandlerList = { [key: string]: TaskHandler<any> };
