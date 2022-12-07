import { QueueStoragePlugin, Task } from "./types";

/** Task Queue Storage Manager */
export class TaskQueueStorageManager {
    currentTasks: Task[] = [];
    finishedTasks: Task[] = [];

  protected storage: QueueStoragePlugin = {};

  async use(storage: QueueStoragePlugin) {
    this.storage = storage;
    await this.load();
  }

  // Write the queue to storage
  async sync() {
    if (this.storage.sync) {
      await this.storage.sync({
        currentTasks: this.currentTasks,
        finishedTasks: this.finishedTasks,
      });
    }
  }

  // Load the queue from storage
  async load() {
    if (this.storage.load) {
      const loaded = await this.storage.load();

      this.currentTasks =
        loaded?.currentTasks && Array.isArray(loaded.currentTasks)
          ? loaded.currentTasks
          : [];
      this.finishedTasks =
        loaded?.finishedTasks && Array.isArray(loaded.finishedTasks)
          ? loaded.finishedTasks
          : [];
    }
  }

  // Remove all data
  async removeAll() {
    this.currentTasks = [];
    this.finishedTasks = [];
    await this.sync();
  }
}
