import { ActionInterface, ActionCtorInterface, Task } from "../types";

export const Validate =
  () =>
  (
    target: ActionInterface<any>,
    method: (props: any) => Record<keyof typeof props, string> | undefined
  ) => {
    target._validate = method;
  };

export const Start =
  () =>
  (target: ActionInterface<any>, _: string, method: PropertyDescriptor) => {
    Object.defineProperties(target, {
      _start: method,
    });
  };

export const Create =
  () =>
  (target: ActionInterface<any>, method: (props: any) => typeof props) => {
    target._create = method;
  };

export const Reducer =
  (key: string) =>
  (target: ActionInterface<any>, method: (acc: any, props: any) => any) => {
    if (!target._reducers) target._reducers = {};
    target._reducers[key] = method;
  };

interface MetadataOptions {
  tags: string[] | ((props: any) => string[]);
  friendlyName: string | ((props: any) => string);
}

export const Metadata =
  (key: string, options: MetadataOptions) => (target: ActionInterface<any>) => {
    if (key) target._key = key;

    if (options.tags) {
      if (typeof options.tags === "function") {
        target._tags = options.tags;
      } else {
        target._tags = () => options.tags as string[];
      }
    }

    if (options.friendlyName) {
      if (typeof options.friendlyName === "function") {
        target._name = options.friendlyName;
      } else {
        target._name = () => options.friendlyName as string;
      }
    }
  };

export class Action<TProps extends Record<string, any>>
  implements ActionCtorInterface<TProps>
{
  constructor(readonly _task: Task<TProps>) {
    this.props = new Proxy(_task.props, {
      get: function (target, prop) {
        if (typeof prop === "symbol") return undefined;
        return target[prop];
      },
      set: function (target, prop, value) {
        if (typeof prop === "symbol") return false;
        //@ts-ignore
        target[prop] = value;
        return true;
      },
    }) as TProps;
  }

  public static _key: "";

  public _tags() {
    return [];
  }

  public static _name() {
    return "";
  }

  public static _validate(props: any) {
    return undefined;
  }

  public static _create(props: any) {
    return props;
  }

  public static _reducers = {};

  public _start() {
    console.error("No Start Defined");
  }

  props: TProps;
}
