import { ActionMetadata } from "./action";
/**
 * An individual task object.
 * All fields must be serializable.
 */
export interface Task {
  id: string;
  key: string;
  props: any;
  status: TaskStatus;
  progress: number;
  attempts: number;
  lastMessage?: string;
  submittedAt: number /** Submitted to queue timestamp */;
  startedAt?: number /** Started working on task timestamp */;
  finishedAt?: number /** Finished working on task timestamp */;
  metadata: ActionMetadata;
}

/** The current status of a task */
export enum TaskStatus {
  FAILED = -1,
  QUEUED,
  IN_PROGRESS,
  FINISHED,
}
