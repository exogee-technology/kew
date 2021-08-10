import { TaskContext } from './task-context';
import { Task } from './task';

export enum TaskEventListenerType {
	ALL,
	TASK_ID,
	TASK_TAG,
	CUSTOM,
}

export type TaskEventListenerFunction = (task: Task<any>, ctx: TaskContext) => any;

export interface TaskEventListenerFilter {
	listenerType: TaskEventListenerType;
	id?: string;
	tag?: string;
	custom?(task: Task<any>): boolean;
}

export interface TaskEventListener {
	callback: TaskEventListenerFunction;
	filter: TaskEventListenerFilter;
}
