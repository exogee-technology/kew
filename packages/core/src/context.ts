import { Task } from "./types";
import { PlatformManager } from "./platform";
import { EventManager } from "./event";
import { Queue } from "./queue";

export class Context {
  constructor(
    protected platformManager: PlatformManager,
    protected eventManager: EventManager,
    protected queue: Queue,
    protected task: Task,
    private noEvents?: boolean
  ) {}

  // Update the props
  setProps = async (props: any): Promise<void> => {
    this.task.props = { ...this.task.props, ...props };
    if (!this.noEvents) this.eventManager.call(this.task);
    await this.platformManager.sync();
  };

  // Return the full raw task data
  getRawTask = (): Task => {
    return { ...this.task };
  };

  addTask = (key: string, props: any): Promise<string> => {
    return this.queue.add(key, props);
  };
}
