import { TaskQueueItemContext } from "./context";

export interface TaskQueueHandlerInfo {
  name?: string;
  tags?: string[];
}

export interface TaskQueueHandler<T> {
  key(): TaskQueueHandlerKey<any>;
  info(data: T): TaskQueueHandlerInfo;
  validate?(data: T): void;
  create?(data: T, ctx: TaskQueueItemContext<T, any, any>): Promise<void>;
  run(data: T, ctx: TaskQueueItemContext<T, any, any>): Promise<void>;
  reducers?: {
    [key: string]: (
      accumulator: any,
      taskData: any,
      ctx: TaskQueueItemContext<T, any, any>
    ) => Promise<any>;
  };
}

export type TaskQueueHandlerKey<TH> = Extract<keyof TH, string>;

export type TaskHandlerList<TH, TR> = {
  [K in TaskQueueHandlerKey<TH>]?: TaskQueueHandler<TH[K]>;
};
