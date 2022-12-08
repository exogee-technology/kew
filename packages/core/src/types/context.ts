import { Task } from "./task";

export interface Context<TProps = any> {
  getRawTask(): Task<TProps>;
  addTask(key: string, props?: any): Promise<string>;
}
