import { ActionInterface, ActionInterfaceCtor, Task } from "../types";

export const Step =
  (name?: string) =>
  (target: ActionInterface<any>, name: string, descriptor: PropertyDescriptor) => {
    Reflect.set(target, `_step_${name || "start"}`, descriptor.value);
  };

export const Reducer =
  (key: string) =>
  (target: ActionInterface<any>, name: string, descriptor: PropertyDescriptor) => {
    Reflect.defineProperty(target, `_reducer_${key}`, descriptor);
  };

interface MetadataOptions {
  tags?: string[];
  friendlyName?: string;
}

export const Metadata =
  (key: string, options?: MetadataOptions) =>
  (target: any) => {
    const tags = options?.tags ? () => options.tags! : () => [] as string[];
    const name = options?.friendlyName ? () => options.friendlyName! : () => "";

    const newTarget = class newTarget extends target {
      tags = tags;
      name = name;
    } as any;

    newTarget.key = key;

    return newTarget;

  };

export class Action<TProps extends Record<string, any>>
  implements ActionInterface<TProps>
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

  public tags: () => string[] = () => [];
  public name: () => string = () => "";

  public validate() {
  }

  public async create() {
  }

  _step(name: string) {
    return (this as any)[`_step_${name}`]?.bind(this);
  }

  _reducer(name: string) {
    return (this as any)[`_reducer_${name}`]?.bind(this);
  }

  props: TProps;
}
