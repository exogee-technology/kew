import { ActionInterface, ActionCtorInterface, Task } from "../types";

export const Start =
  () =>
  (target: ActionInterface<any>, _: string, descriptor: PropertyDescriptor) => {
    Reflect.set(target, "_start", descriptor.value);
  };

export const Reducer =
  (key: string) =>
  (target: ActionInterface<any>, _: string, descriptor: PropertyDescriptor) => {
    Reflect.defineProperty(target, `_reducer_${key}`, descriptor);
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

  public static _tags() {
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

  _start() {}

  _reducer(name: string) {
    return (this as any)[`_reducer_${name}`]?.bind(this);
  }

  props: TProps;
}
