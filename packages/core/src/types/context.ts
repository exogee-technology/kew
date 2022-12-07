import { TaskQueueItem } from "./item";

export interface TaskQueueItemContext<T, TH, TR> {
  setProgress(progress: number): Promise<void>;
  createId(): string;
  setTaskData(taskData: Partial<T>): Promise<void>;
  getRawTask(): TaskQueueItem<T, TH, TR>;
  addTask(
    key: Extract<keyof TH, string>,
    data?: TH[typeof key]
  ): Promise<string>;
}
