# @exogee/kew

A typed task queue with a simple API.

- Create a _Queue_
- Attach a _Platform_ for storage and data persistence.
- Register one or more _Action_\ s to perform various types of tasks.
- Actions are simple objects with lifecycle methods.
- Add _Task_\ s to the _Queue_.

## Example

```ts
// index.ts
import { Queue, TaskStatus, Action, Logging } from "@exogee/kew";
import { Platform } from "@exogee/kew-react-native-async-storage";

const reverseStringAction: Action = {
  key: () => "ReverseString",
  run: async ({ value }, { setProps }) => {
    await setProps({ value: value.split("").reverse().join("") });
  },
};

// Create a new queue
const queue = new Queue({
  platform: new Platform("my_application_queue"),
  actions: [reverseStringAction],
  logging: Logging.DEBUG,
});

// Register an event listener
queue.on(
  (task) => task.status === TaskStatus.FINISHED,
  ({ props }) => {
    console.log("Task completed: ", props.value);
    queue.stop();
  }
);

// Add task to the queue and start
(async () => {
  await queue.add("ReverseString", { value: "!olleH" });
  await queue.start();
})();
```

See `@exogee/kew-example` for a more complex example

## API

### `const queue = new Queue({ platform?, actions? });`

Create a new queue with optional platform and Actions

### `async queue.run(actionKey, props)`

Run the action `actionKey` with optional `props` and return the result immediately, without adding to the queue.

### `async queue.add(actionKey, props)`

Add a new task of action type `actionKey` to the queue with optional `props` - returns a unique task ID.

### `async queue.start()`

Start the queue.

### `queue.stop()`

Stop the queue.

### `queue.pause()`

Pause the queue

### `queue.unpause()`

Unpause the queue

### `async queue.reducer(reducerKey, initialValue, filter)`

Run the reducer named `reducerKey` over the queue.
Optionally, an `initialValue` can be provided which will be the initial value of the accumulator.
Optionally, a `filter` function can be provided which will only apply the reducer if the filter returns true for a task.

Returns a promise with the reduced data result.

### `queue.addActions(...actions[])`

Register one or more actions if not registered in the constructor.

### `queue.on(filter, callback): TaskQueueEventSubscription`

Subscribe to a task queue event.
Returns a subscription object with a remove() method to unsubscribe.

### `queue.tasks()`

Get a list of all tasks.

### `async queue.clear()`

Remove all tasks from the queue

## Platforms

### Example Platform

```ts
const AsyncStoragePlatform: Platform = {
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

export default AsyncStoragePlatform;
```
