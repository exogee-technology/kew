import { Task, TaskStatus } from "./types";

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

export interface CreateInitialTaskOptions {
  key: string;
  tags: string[];
  name: string;
  props: any;
}

export const createInitialTask = ({
  key,
  tags,
  name,
  props = {},
}: CreateInitialTaskOptions): Task => {
  return {
    key,
    props,
    metadata: {
      tags,
      name,
    },
    status: TaskStatus.QUEUED,
    id: uniqueId(),
    submittedAt: Date.now(),
    attempts: 0,
  };
};
