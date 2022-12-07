import { TaskQueuePlugin } from "./plugin";
import {
  TaskQueueEventEmitterCallback,
  TaskQueueEventEmitterFilter,
  TaskQueueEventEmitterSubscription,
} from "./event-emitter";
import { TaskQueueItem } from "./item";

export interface KewReducerOptions<T, TH, TR> {
  filter?: (item: TaskQueueItem<T, TH, TR>) => boolean;
}

export interface TaskQueueInterface<TH, TR> {
  run(
    key: Extract<keyof TH, string>,
    data?: TH[typeof key]
  ): Promise<TH[typeof key] | undefined>;
  add(key: Extract<keyof TH, string>, data?: TH[typeof key]): Promise<string>;
  start(): Promise<void>;
  stop(): void;
  reducer(
    key: Extract<keyof TR, string>,
    initialValue?: TR[typeof key],
    options?: KewReducerOptions<TR[typeof key], TH, TR>
  ): Promise<TR[typeof key] | undefined>;
  plugins(...plugins: TaskQueuePlugin[]): void;
  on(
    filter: TaskQueueEventEmitterFilter<TH, TR>,
    callback: TaskQueueEventEmitterCallback<TH, TR>
  ): TaskQueueEventEmitterSubscription;
  tasks(): TaskQueueItem<unknown, TH, TR>[];
  clear(): Promise<void>;
}
