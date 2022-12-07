import { EventCallback, EventFilter, EventSubscription } from "./event";
import { Task } from "./task";
import { Action } from "./action";

export interface ReducerOptions {
  filter: EventFilter;
}

export interface QueueInterface {
  run(key: string, props?: any): Promise<any>;

  add(key: string, props: any): Promise<string>;

  start(): Promise<void>;

  stop(): void;

  reducer(
    key: string,
    initialValue?: any,
    options?: ReducerOptions
  ): Promise<any>;

  on(filter: EventFilter, callback: EventCallback): EventSubscription;

  tasks(): Task[];

  clear(): Promise<void>;
}
