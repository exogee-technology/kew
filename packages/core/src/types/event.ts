import { Task } from "./task";

export type EventFilter = (task: Task) => boolean;

export type EventCallback = (task: Task) => void;

export interface EventListener {
  callback: EventCallback;
  filter: EventFilter;
}

export interface EventSubscription {
  remove: () => void;
}
