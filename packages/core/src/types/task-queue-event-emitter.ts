import { TaskQueueItem } from "./task-queue-item";

export type TaskQueueEventEmitterFilter<TH, TR> = (
  task: TaskQueueItem<unknown, TH, TR>
) => boolean;
export type TaskQueueEventEmitterCallback<TH, TR> = (
  task: TaskQueueItem<unknown, TH, TR>
) => void;

export interface TaskQueueEventEmitter<TH, TR> {
  callback: TaskQueueEventEmitterCallback<TH, TR>;
  filter: TaskQueueEventEmitterFilter<TH, TR>;
}

export interface TaskQueueEventEmitterSubscription {
  remove: () => void;
}
