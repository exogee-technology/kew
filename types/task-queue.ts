import {TaskQueuePlugin} from "./task-queue-plugin";
import {
    TaskQueueEventEmitterCallback,
    TaskQueueEventEmitterFilter,
    TaskQueueEventEmitterSubscription
} from "./task-queue-event-emitter";
import {TaskQueueItem} from "./task-queue-item";

export interface TaskQueueInterface<TH, TR> {
    run(key: Extract<keyof TH, string>, data?: TH[typeof key]): Promise<TH[typeof key] | undefined>
    add(key: Extract<keyof TH, string>, data?: TH[typeof key]): Promise<string>
    start(): Promise<void>
    stop(): void;
    reducer(key: Extract<keyof TR, string>, initialValue?: TR[typeof key]): Promise<TR[typeof key] | undefined>
    plugins(...plugins: TaskQueuePlugin[]): void
    on(filter: TaskQueueEventEmitterFilter, callback: TaskQueueEventEmitterCallback): TaskQueueEventEmitterSubscription
    tasks(): TaskQueueItem<unknown>[]
    clear(): Promise<void>
}