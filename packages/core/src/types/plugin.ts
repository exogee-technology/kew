export interface QueueStoragePlugin {
  sync?(data: QueueStoragePluginData): Promise<void>;
  load?(): Promise<QueueStoragePluginData>;
}

export interface QueueStoragePluginData {
  currentTasks: any;
  finishedTasks: any;
}

export interface TaskQueuePlugin {
  storage: QueueStoragePlugin;
}
