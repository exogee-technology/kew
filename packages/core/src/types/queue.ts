import { TaskQueuePlugin } from "./plugin";
import {
  TaskQueueEventEmitterCallback,
  TaskQueueEventEmitterFilter,
  TaskQueueEventEmitterSubscription,
} from "./event-emitter";
import { Task } from "./task";
import { Action } from "./action";

export interface KewReducerOptions {
  filter?: (task: Task) => boolean;
}

export interface TaskQueueInterface {
  run(key: string, props?: any): Promise<any>;

  add(key: string, props: any): Promise<string>;

  start(): Promise<void>;

  stop(): void;

  reducer(
    key: string,
    initialValue?: any,
    options?: KewReducerOptions
  ): Promise<any>;

  addActions(...actions: Action[]): void;

  plugins(...plugins: TaskQueuePlugin[]): void;

  on(
    filter: TaskQueueEventEmitterFilter,
    callback: TaskQueueEventEmitterCallback
  ): TaskQueueEventEmitterSubscription;

  tasks(): Task[];

  clear(): Promise<void>;
}
