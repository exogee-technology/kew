import { TaskHandlerInfo, TaskState } from './types';
import { v4 } from 'uuid';

export const isSerializable = (data: any): boolean => {
	try {
		JSON.stringify(data);
		return true;
	} catch (e) {
		return false;
	}
};

export const sleep = (ms: number): Promise<void> =>
	new Promise((resolve) => setTimeout(resolve, ms));

export const createInitialTask = (taskType: string, taskData: any, info: TaskHandlerInfo) => ({
	taskType,
	taskData,
	info,
	taskState: TaskState.QUEUED,
	id: v4(),
	date: Date.now(),
	progress: 0,
});
