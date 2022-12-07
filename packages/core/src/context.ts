import { Task } from "./types";
import { TaskQueueStorageManager } from "./storage";
import { TaskQueueEventEmitterManager } from "./event-emitter";
import { TaskQueue } from "./queue";

/** Task Queue Item Context Manager */
export class TaskQueueItemContext {

    task: Task;
    storageManager: TaskQueueStorageManager;
    eventEmitterManager: TaskQueueEventEmitterManager;
    taskQueue: TaskQueue;

  constructor(
          storageManager: TaskQueueStorageManager,
          eventEmitterManager: TaskQueueEventEmitterManager,
          taskQueue: TaskQueue,
          task: Task,
    private noEvents?: boolean
  ) {
    this.storageManager = storageManager;
    this.eventEmitterManager = eventEmitterManager;
    this.taskQueue = taskQueue;
    this.task = task;
  }

  // Update the props
    setProps = async (props: any): Promise<void> => {
    this.task.props = { ...this.task.props, ...props };
    if (!this.noEvents) this.eventEmitterManager.call(this.task);
    await this.storageManager.sync();
  };

  // Return the full raw task data
    getRawTask = (): Task => {
    return { ...this.task };
  };

  addTask = (
    key: string,
    props: any,
  ): Promise<string> => {
      return this.taskQueue.add(key, props);
  };
}
