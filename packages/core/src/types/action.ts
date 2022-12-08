import { Context } from "./context";
import { Task } from "./task";

export interface ActionInterface<TProps extends Record<string, any>> {
  _key: string;
  _tags(props: TProps): string[];
  _name(props: TProps): string;
  _validate(props: TProps): Record<keyof TProps, string> | undefined;
  _create(props: TProps): TProps;
  _start: string;
  new (props: TProps): ActionCtorInterface<TProps>;
}

export interface ActionCtorInterface<TProps> {
  _start: (context: Context<TProps>) => Promise<void> | void;
  _task: Task<TProps>;
  _reducer: (
    name: string
  ) => (accumulator: any, context: Context<TProps>) => Promise<any> | any;
  props: TProps;
}
