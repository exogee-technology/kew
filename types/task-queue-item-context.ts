export interface TaskQueueItemContext {
	setProgress(progress: number): Promise<void>;
	createId(): string;
	setTaskData(taskData: any): Promise<void>;
}
