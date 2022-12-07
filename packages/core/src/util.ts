import { ActionMetadata, Task, TaskStatus } from "./types";

const uniqueId = () => Math.floor(Math.random() * Date.now()).toString();

export const isSerializable = (data: any): boolean => {
  try {
    JSON.stringify(data);
    return true;
  } catch (e) {
    return false;
  }
};

export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const createInitialTask = (
  key: string,
  metadata: ActionMetadata = {},
  props: any = {}
): Task => {
  return {
    key,
    props,
    metadata,
    status: TaskStatus.QUEUED,
    id: uniqueId(),
    submittedAt: Date.now(),
    progress: 0,
    attempts: 0,
  };
};
