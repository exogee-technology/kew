# kew

A typed task queue designed for use with **React Native** 
with powerful data features & a simple API.

---
## Features
- Create one or more task queues.
- Attach *Plugins* for storage and data persistence.
- Register *Handlers* to perform various task types.
  
---
## Task Handlers
- Are simple objects with methods.
- Can validate new tasks before they are added to the queue.
- Can report back task progress through listener events.
- Can contain reducer functions to report queue data.
- Can store serializable data that persists across app restarts.
  
---
## Example Usage

```ts
// SendMessage.ts
import { TaskQueueHandler } from '@exogee/kew';
import { mySendMessageAPI } from 'my-send-message-service';

// Define the SendMessage Task Handler Event
export interface SendMessageData {
    messageText: string;
    recipient: string;
}

// Define the SendMessage Task Handler
export const SendMessage: TaskQueueHandler<SendMessageData> = {
    key: () => "sendMessage",
    info: async ({recipient}) => ({
        friendlyName: `Send Message To ${recipient}`,
        tags: ['message']
    }),
    validate: ({messageText, recipient}) => {
        if(!messageText) throw new Error("Missing Message Text")
        if(!recipient) throw new Error("Missing Recipient")
    },
    run: async ({messageText, recipient}, { setProgress }) => {
        const message = mySendMessageAPI(recipient, messageText)
        message.on('progress', (progress) => setProgress(progress))
        await message.send()
    },
    reducers: {
        totalMessageLength: async(length = 0, { messageText }) => length += messageText.length
    }
}
```

```ts
// index.ts
import {createTaskQueue, asyncStoragePlugin} from '@exogee/kew';
import {Alert} from 'react-native';
import {SendMessage, SendMessageData} from './SendMessage'
import {TaskQueueTaskStatus} from "./task-queue-item";

// Define the data types for handlers
interface TaskHandlers {
    sendMessage: SendMessageData
}

// Define the data types for reducers
interface TaskReducers {
    totalMessageLength: number
}

// Create a new typed queue
const queue = createTaskQueue<TaskHandlers, TaskReducers>({
    plugins: [asyncStoragePlugin('my-queue')],
    handlers: [SendMessage]
});

// Add item to the queue
const id = queue.add('sendMessage', {messageText: "Hello!", on})

// Register a filter listener
queue.on(
    (task) => task.id === id && task.status === TaskQueueTaskStatus.FINISHED,
    () => Alert.alert("Task completed"))

// Run queue
queue.run();
```

---

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
## Example Storage Plugin

```ts
const AsyncStoragePlugin: QueuePlugin = {

    storage: {
      // load is called when the queue data needs to be reloaded.
      async load() {
        return await AsyncStorage.getItem('TASK_QUEUE')
                .then(tasksJSON => callback(JSON.parse(tasksJSON)))
                .catch(() => ({}));
      },

      // sync is called with the new queue data whenever the queue is updated.
      async sync(queue: QueueStorageData) {
        await AsyncStorage.setItem('TASK_QUEUE', JSON.stringify(queue))
      }
    }
}

export default AsyncStoragePlugin
```

---
## Task Context
### `async setProgress(progress: number): Promise<void>`
Set the progress of the current task, expects a float between 0 and 1

### `async setData(data: any): Promise<void>`
Update the task data

### `async createRef(key: string): Promise<string>`
Takes a taskData key and returns an ID Promise<string> to be resolved in future tasks

### `async resolveRef(ref: string): Promise<string>`
If it exists, returns the taskData that the reference points to, otherwise, transparently returns the key

### `async isRef(ref: string): Promise<boolean>`
Check that key is a valid reference and returns a Promise<boolean>

### `async deleteRef(ref: string): Promise<void>`
Delete a reference, if it is no longer needed.

---

## Named Reducers
- Tasks can implement any number of named reducers.
- When `TaskQueue.reduce(reducerName)` is called, each queue task's reducer will be called in order where available-
with the accumulated result as the first parameter, and the new task data as the second.
- An initial value can be provided to runTaskReducer as an optional second argument.

---

## References
- Future queue tasks may need to reference IDs created by previous task network calls, even when the task has not run yet.
- Tasks that create resources can call createRef(key) to create a temporary ID reference that will resolve to that ID in the future.