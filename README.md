# kew

A fancy task queue with powerful data features & a simple API.

---
## Features
- Create multiple task queues.
- Attach storage plugins for data persistence.
- Set queue as online/offline to prevent queue tasks being attempted.
- Register task handlers for various task types.
- Task handlers are simple objects with methods.
- Task handlers can validate new tasks before they are added to the queue.
- Run the queue with various options.
  - Choose what to do when the queue fails.
- Task handlers can report back task progress.
- Run reducers over the queue to report back queue data.

---
## Example Usage

```typescript
// Create new Queue
const queue = new TaskQueue()

// Register Storage Plugin
queue.addPlugin(queueStorageWithAsyncStorage)

// Register Task handlers
queue.addHandler('do-thing', importedTaskHandler)

// Add items to queue
const id = queue.addTask('do-thing', {probabilityOfFailure: 0.3})

// Register a listener
queue.addListener((task) => console.log(task), {listenerType: TaskEventListenerType.TASK_ID, id})

// Run queue until finished
queue.runQueue()
        .then(() => console.log('Success!'))
        .catch((e) => console.error('Failed :(', e))
```

---

## Queue API

### `async addTask(handler: string, data?: any, opts?: QueueAddOptions): Promise<string>`

Add a new task of type `handlerType` to the queue, with optional task data `data` and optional options `opts`.

Valid options:
- `ignoreValidation: boolean` prevents task data from being validated before it is added to the queue
- `ignoreUnserializable: boolean` prevents errors if task data is not serializable.

---
### `async runQueue(opts: QueueRunOptions): Promise<TaskResult>`

Run the queue with optional options `opts`.
Returns a `TaskResult` when the queue stops.

---
### `stopQueue(): void`

Stop a currently running queue

---
### `runReducer(taskReducer: string | TaskReducerFunction, init?: any): Promise<any>`

Run a named or custom reducer over the queue.

- If `taskReducer` is a `string`, will run the named reducer over each queue item.
- If `taskReducer` is a `TaskReducerFunction`, will run the provided function over each queue item.

Optionally, an `init` can be provided which will be the initial value of the accumulator.

Returns a promise with the reduced data object.

---
### `addPlugin(plugin: QueuePlugin): void`

Register a plugin

---
### `setOffline(value: boolean): void`

---
### `addHandler(type: string, handler: TaskHandler<any>): void`

Register a Task Handler

---
### `addListener(callback: TaskEventListenerFunction, filter: TaskEventListenerFilter): void`

---
### `removeListener(callback: TaskEventListenerFunction): void`

---
### `getCurrentTasks(): void`

---
### `getCompletedTasks(): void`

---
### `getAllTasks(): void`

---
### `getReferences(): void`

---
### `async removeAllTasks(): Promise<void>`

---

## Example Task Handler
```typescript
interface ExampleTaskHandlerTaskData {
  probabilityOfFailure: number;
}

const ExampleTaskHandler: TaskHandler<ExampleTaskHandlerTaskData> = {
    
    // info returns meta information for the handler as per TaskHandlerInfo
    async info(taskData: ExampleTaskHandlerTaskData) {
        return {
          friendlyName: 'Example Task Handler'
        }
    },

    // validate validates the task data before it is added to the queue,
    // it is passed taskData as the first argument
    async validate (taskData: ExampleTaskHandlerTaskData) {
        if (taskData.probabilityOfFailure > 1) throw new Error('Probability must be less than or equal to 1')
    },
  
    // create sets up the task before it is run
    // it is passed taskData as the first argument, and a context object
    // as the second
    async create(taskData: ExampleTaskHandlerTaskData) {
        if(!taskData.probabilityOfFailure) taskData.probabilityOfFailure = 0.5
    },
    
    // run is called whenever the task is run is passed in taskData as the first argument,
    // and a context object as the second.
    async run(taskData: ExampleTaskHandlerTaskData, { setProgress }) {
        setProgress(0.3);
        if (Math.random() < taskData.probabilityOfFailure) throw new Error('Failed');
        setProgress(1.0);
    },

    reducers: {
        async average(currentAverage, taskData) {
            return currentAverage
              ? ((taskData.probabilityOfFailure + currentAverage) / 2)
              : (taskData.probabilityOfFailure)
        }
    }

}

export default ExampleTaskHandler
```

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
- When `TaskQueue.runReduce(reducerName)` is called, each queue task's reducer will be called in order where available-
with the accumulated result as the first parameter, and the new task data as the second.
- An initial value can be provided to runTaskReducer as an optional second argument.

---

## References
- Future queue tasks may need to reference IDs created by previous task network calls, even when the task has not run yet.
- Tasks that create resources can call createRef(key) to create a temporary ID reference that will resolve to that ID in the future.