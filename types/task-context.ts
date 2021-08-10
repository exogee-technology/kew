export interface TaskContext {
	isRef(ref: string): Promise<boolean>;
	createRef(value: any): Promise<string>;
	resolveRef(ref: string): Promise<any>;
	deleteRef(ref: string): Promise<any>;
	setProgress(progress: number): Promise<void>;
	createId(): Promise<string>;
	setTaskData(taskData: any): Promise<void>;
}
