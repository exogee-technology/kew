import {TaskQueueHandlerInfo, TaskQueueItem, TaskQueueItemStatus} from './types';
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

export const createInitialTask = <TH, TR>(key: Extract<keyof TH, string>, info: TaskQueueHandlerInfo, data: TH[typeof key]): TaskQueueItem<TH[typeof key], TH, TR> => {

	return {
		// @ts-ignore @todo
		key,
		data,
		info,
		status: TaskQueueItemStatus.QUEUED,
		id: v4(),
		submittedAt: Date.now(),
		progress: 0,
		attempts: 0
	}
}

