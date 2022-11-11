export interface Reference<T> {
  referenceToTaskId: string;
  referenceToTaskDataKey: keyof T;
}
