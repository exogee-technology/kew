import { Task } from "./task";

export interface TaskQueueItemContext {
  setProps(props: any): Promise<void>;
  getRawTask(): Task;
  addTask(key: string, props?: any): Promise<string>;
}
