export enum QueueRunFailureMode {
	STOP,
	RETRY,
}

export interface QueueRunOptions {
	failureMode: QueueRunFailureMode;
}

export interface QueueAddOptions {
	ignoreUnserializableData: boolean;
	ignoreValidation: boolean;
}
