import { TaskQueueItemContext } from "./context";

export interface ActionMetadata {
  name?: string;
  tags?: string[];
}

export interface Action  {
  key(): string,

    metadata?(props: any): ActionMetadata;

  validate?(props: any): void;

  create?(
          props: any,
    context: TaskQueueItemContext,
  ): Promise<void>;

  run(
          props: any,
    context: TaskQueueItemContext,
  ): Promise<void>;

  reducers?: {
    [key: string]: (
      accumulator: any,
      props: any,
      context: TaskQueueItemContext,
    ) => Promise<any>;
  };
}

export interface MapOfActions {
    [key: string]: Action
}