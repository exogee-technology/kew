export interface PlatformInterface {
  sync(data: PlatformStorageData): Promise<void>;
  load(): Promise<PlatformStorageData>;
}

export interface PlatformStorageData {
  currentTasks: any;
  finishedTasks: any;
}
