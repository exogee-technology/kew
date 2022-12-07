import { PlatformInterface, Task } from "./types";

export class PlatformManager {
  currentTasks: Task[] = [];
  finishedTasks: Task[] = [];

  constructor(protected platform?: PlatformInterface) {}

  // Write the queue to storage
  async sync() {
    await this.platform?.sync({
      currentTasks: this.currentTasks,
      finishedTasks: this.finishedTasks,
    });
  }

  // Load the queue from storage
  async load() {
    const loaded = await this.platform?.load();

    this.currentTasks =
      loaded?.currentTasks && Array.isArray(loaded.currentTasks)
        ? loaded.currentTasks
        : [];

    this.finishedTasks =
      loaded?.finishedTasks && Array.isArray(loaded.finishedTasks)
        ? loaded.finishedTasks
        : [];
  }

  // Remove all data
  async removeAll() {
    this.currentTasks = [];
    this.finishedTasks = [];
    await this.sync();
  }
}
