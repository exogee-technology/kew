import { Task } from "./task";

export type TaskQueueEventEmitterFilter = (
        task: Task
) => boolean;

export type TaskQueueEventEmitterCallback = (
        task: Task
) => void;

export interface TaskQueueEventEmitter {
    callback: TaskQueueEventEmitterCallback;
    filter: TaskQueueEventEmitterFilter;
}

export interface TaskQueueEventEmitterSubscription {
  remove: () => void;
}
