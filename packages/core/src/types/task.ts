/**
 * An individual task object.
 * All fields must be serializable.
 */
export interface Task<TProps = any> {
  id: string;
  key: string;
  props: TProps;
  status: TaskStatus;
  attempts: number;
  lastMessage?: string;
  submittedAt: number /** Submitted to queue timestamp */;
  startedAt?: number /** Started working on task timestamp */;
  finishedAt?: number /** Finished working on task timestamp */;
    tags?: string[];
    name?: string;
}

/** The current status of a task */
export enum TaskStatus {
  FAILED = -1,
  QUEUED,
  IN_PROGRESS,
  FINISHED,
}
