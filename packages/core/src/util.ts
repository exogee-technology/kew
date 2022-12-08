import { Task, TaskStatus } from "./types";

const uniqueId = () => Math.floor(Math.random() * Date.now()).toString();

export const isSerializable = (data: any): boolean => {
  try {
    JSON.stringify(data);
    return true;
  } catch (_) {
    return false;
  }
};

export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));


export const createInitialTask = (key: string, props: any): Task => {
  return {
    key,
      props,
    status: TaskStatus.QUEUED,
    id: uniqueId(),
    submittedAt: Date.now(),
    attempts: 0,
  };
};
