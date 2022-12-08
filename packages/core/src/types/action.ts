import { Context } from "./context";
import { Task } from "./task";

export interface ActionInterface<TProps extends Record<string, any>> {
  _key: string;
  _tags(props: TProps): string[];
  _name(props: TProps): string;
  _validate(props: TProps): Record<keyof TProps, string> | undefined;
  _create(props: TProps): TProps;
  _reducers: {
    [key: string]: (
      accumulator: any,
      props: any,
      context: Context<TProps>
    ) => Promise<any> | any;
  };
  new (props: TProps): ActionCtorInterface<TProps>;
}

export interface ActionCtorInterface<TProps> {
  _start: (context: Context<TProps>) => Promise<void> | void;
  _task: Task<TProps>;
  props: TProps;
}
