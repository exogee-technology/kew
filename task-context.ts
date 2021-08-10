import { v4 } from 'uuid';

import { Task } from './types';
import { QueueStorageManager } from './storage';
import { QueueListenerManager } from './listener';

/**
 * Task Context Manager
 * Manage Task Context
 */
export class TaskContext<T> {
	task: Task<T>;
	storageManager: QueueStorageManager;
	listenerManager: QueueListenerManager;

	constructor(
		storageManager: QueueStorageManager,
		listenerManager: QueueListenerManager,
		task: Task<T>
	) {
		this.storageManager = storageManager;
		this.listenerManager = listenerManager;
		this.task = task;
	}

	// Return the task context
	getContext() {
		return {
			isRef: this.isRef,
			createRef: this.createRef,
			resolveRef: this.resolveRef,
			deleteRef: this.deleteRef,
			setProgress: this.setProgress,
			createId: this.createId,
			setTaskData: this.setTaskData,
		};
	}

	// Check that a given string is a reference, returns a boolean
	isRef = async (reference: string): Promise<boolean> => {
		return reference.startsWith('@ref:');
	};

	// Create a new temporary reference to a given taskData key
	createRef = async (key: string): Promise<string> => {
		const reference = `@ref:${v4()}`;
		this.storageManager.references[reference] = {
			referenceToTaskId: this.task.id,
			referenceToTaskDataKey: key,
		};
		await this.storageManager.sync();
		return reference;
	};

	// Resolve a temporary reference
	resolveRef = async (reference: string): Promise<any> => {
		if (!reference.startsWith('@ref:')) return reference;
		const ref = this.storageManager.references[reference];
		if (!ref) throw new Error('Cannot find reference');
		const task = this.storageManager.finishedTasks.find(
			(task) => task.id === ref.referenceToTaskId
		);
		if (!task) throw new Error('Cannot find referenced task');
		return task.taskData[ref.referenceToTaskDataKey];
	};

	// Delete a reference
	deleteRef = async (reference: string): Promise<void> => {
		if (await this.isRef(reference)) {
			delete this.storageManager.references[reference];
		}
	};

	// Update the task data
	setTaskData = async (taskData: any) => {
		this.task.taskData = taskData;
		this.listenerManager.call(this.task);
		await this.storageManager.sync();
	};

	// Change the task progress
	setProgress = async (progress: number) => {
		this.task.progress = progress;
		this.listenerManager.call(this.task);
		await this.storageManager.sync();
	};

	// Create a new unique ID
	createId = async (): Promise<string> => {
		return v4();
	};
}
