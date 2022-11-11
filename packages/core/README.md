# @exogee/kew

A typed task queue with a simple API.

---

## Features

- Create one or more _Queues_.
- Attach _Platforms_ for storage and data persistence.
- Register _Actions_ to perform various types of tasks.

---

## Actions 

- Simple objects with lifecycle methods.
- Can contain reducer functions to report queue data.

---

## Tasks

- Individual instance of an action with its data
- Can store serializable data that persists across app restarts.

---

## Example Usage

- See `@exogee/kew-example`


## API

### `createTaskQueue({ plugins: TaskQueuePlugin[], handlers: TaskQueueHandler[] }): TaskQueue`

Convenience method to create a new task queue with the provided plugins and handlers.

---

### `async TaskQueue.run(key: keyof TH, data?: typeof key): Promise<typeof key>`

Add a new task of type `key` to the queue with optional `data`

---

### `async TaskQueue.add(key: keyof TH, data?: typeof key): Promise<string>`

Add a new task of type `key` to the queue with optional `data`

---

### `async TaskQueue.start(): Promise<void>`

Start the queue.

---

### `TaskQueue.stop(): void`

Stop the queue.

---

### `TaskQueue.reducer(reducer: keyof TR, initialValue?: typeof reducer, filter?: TaskQueueFilterFunction): Promise<typeof reducer>`

Run a named reducer over the queue

Optionally, an `initialValue` can be provided which will be the initial value of the accumulator.
Optionally, a `filter` function can be provided which will only apply the reducer if the filter returns true for a task.

Returns a promise with the reduced data.

---

### `TaskQueue.plugins(...plugins: TaskQueuePlugin[]): void`

Register a plugin- can also be registered in `createTaskQueue`

---

### `TaskQueue.handlers(...handlers: TaskQueueHandler[]): void`

Register one or more task handlers- can also be registered in `createTaskQueue`

---

### `TaskQueue.on(filter: TaskQueueFilterFunction, callback: TaskQueueEventCallback): TaskQueueEventSubscription`

Subscribe to a task queue event.
Returns a subscription object with a remove() method to unsubscribe.

---

### `TaskQueue.tasks(): TaskQueueItem[]`

Get a list of all tasks.

---

### `async TaskQueue.clear(): Promise<void>`

Remove all tasks from the queue

---

## Example Plugin

```ts
const AsyncStoragePlugin: QueuePlugin = {
  storage: {
    // load is called when the queue data needs to be reloaded.
    async load() {
      return await AsyncStorage.getItem("TASK_QUEUE")
        .then((tasksJSON) => callback(JSON.parse(tasksJSON)))
        .catch(() => ({}));
    },

    // sync is called with the new queue data whenever the queue is updated.
    async sync(queue: QueueStorageData) {
      await AsyncStorage.setItem("TASK_QUEUE", JSON.stringify(queue));
    },
  },
};

export default AsyncStoragePlugin;
```

---

## Task Context

### `async setData(data: any): Promise<void>`
Update the task data

---

## Named Reducers

- Tasks can implement any number of named reducers.
- When `TaskQueue.reduce(reducerName)` is called, each queue task's reducer will be called in order where available-
  with the accumulated result as the first parameter, and the new task data as the second.
- An initial value can be provided to runTaskReducer as an optional second argument.
