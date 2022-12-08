import { Context } from "./context";
import { Task } from "./task";

export interface ActionInterfaceCtor<TProps> {
    key: string;
    new(props: TProps): ActionInterface<TProps>
}

export interface ActionInterface<TProps> {
    tags(): string[];
    name(): string;
    validate(): Record<keyof TProps, string> | undefined;
    create(): void | Promise<void>;
    props: TProps;
    _step: (name: string) => (context: Context<TProps>) => Promise<void> | void;
  _task: Task<TProps>;
  _reducer: (
    name: string
  ) => (accumulator: any, context: Context<TProps>) => Promise<any> | any;
}
