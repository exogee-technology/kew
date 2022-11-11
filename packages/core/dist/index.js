// src/types/task-queue-item.ts
var TaskQueueItemStatus = /* @__PURE__ */ ((TaskQueueItemStatus2) => {
  TaskQueueItemStatus2[TaskQueueItemStatus2["FAILED"] = -1] = "FAILED";
  TaskQueueItemStatus2[TaskQueueItemStatus2["QUEUED"] = 0] = "QUEUED";
  TaskQueueItemStatus2[TaskQueueItemStatus2["IN_PROGRESS"] = 1] = "IN_PROGRESS";
  TaskQueueItemStatus2[TaskQueueItemStatus2["FINISHED"] = 2] = "FINISHED";
  return TaskQueueItemStatus2;
})(TaskQueueItemStatus || {});
var TaskQueueItemError = class extends Error {
  constructor(message, fatalError) {
    super(message);
    this.fatalError = fatalError;
  }
};

// src/task-queue-storage.ts
var TaskQueueStorageManager = class {
  constructor() {
    this.currentTasks = [];
    this.finishedTasks = [];
    this.references = {};
    this.storage = {};
  }
  async use(storage) {
    this.storage = storage;
    await this.load();
  }
  async sync() {
    if (this.storage.sync) {
      await this.storage.sync({
        currentTasks: this.currentTasks,
        finishedTasks: this.finishedTasks,
        references: this.references
      });
    }
  }
  async load() {
    if (this.storage.load) {
      const loaded = await this.storage.load();
      this.currentTasks = loaded?.currentTasks && Array.isArray(loaded.currentTasks) ? loaded.currentTasks : [];
      this.finishedTasks = loaded?.finishedTasks && Array.isArray(loaded.finishedTasks) ? loaded.finishedTasks : [];
      this.references = loaded?.references && !Array.isArray(loaded.references) ? loaded.references : {};
    }
  }
  async removeAll() {
    this.currentTasks = [];
    this.finishedTasks = [];
    this.references = {};
    await this.sync();
  }
};

// src/task-queue-item-context.ts
var TaskQueueItemContext = class {
  constructor(storageManager, eventEmitterManager, taskQueue, task, noEvents) {
    this.noEvents = noEvents;
    this.setTaskData = async (data) => {
      this.task.data = { ...this.task.data, ...data };
      if (!this.noEvents)
        this.eventEmitterManager.call(this.task);
      await this.storageManager.sync();
    };
    this.setProgress = async (progress) => {
      this.task.progress = progress;
      if (!this.noEvents)
        this.eventEmitterManager.call(this.task);
      await this.storageManager.sync();
    };
    this.createId = () => {
      return "";
    };
    this.getRawTask = () => {
      return { ...this.task };
    };
    this.addTask = (key, data) => {
      return this.taskQueue.add(key, data);
    };
    this.storageManager = storageManager;
    this.eventEmitterManager = eventEmitterManager;
    this.taskQueue = taskQueue;
    this.task = task;
  }
};

// src/task-queue-event-emitter.ts
var TaskQueueEventEmitterManager = class {
  constructor(storageManager) {
    this.listeners = [];
    this.storageManager = storageManager;
  }
  add(callback, filter) {
    this.listeners.push({
      filter,
      callback
    });
    return {
      remove: () => this.remove(callback)
    };
  }
  remove(callback) {
    this.listeners = this.listeners.filter((listener) => listener.callback === callback);
  }
  call(task) {
    for (const listener of this.listeners) {
      if (listener.filter(task))
        listener.callback(task);
    }
  }
};

// src/util.ts
var uniqueId = () => Math.floor(Math.random() * Date.now()).toString();
var isSerializable = (data) => {
  try {
    JSON.stringify(data);
    return true;
  } catch (e) {
    return false;
  }
};
var sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
var createInitialTask = (key, info, data) => {
  return {
    key,
    data,
    info,
    status: 0 /* QUEUED */,
    id: uniqueId(),
    submittedAt: Date.now(),
    progress: 0,
    attempts: 0
  };
};

// src/task-queue.ts
var createTaskQueue = ({
  plugins,
  handlers
}) => {
  const queue = new TaskQueue();
  plugins && queue.plugins(...plugins);
  handlers && queue.handlers(...handlers);
  return queue;
};
var TaskQueue = class {
  constructor() {
    this.taskHandlers = {};
    this.storageManager = new TaskQueueStorageManager();
    this.listenerManager = new TaskQueueEventEmitterManager(
      this.storageManager
    );
    this.isRunning = false;
    this.isPaused = false;
    this.onQueueStopped = void 0;
    this.onQueueStarted = void 0;
  }
  log(message, data) {
    console.log("kew: ", message, data);
  }
  async run(key, data) {
    const registeredHandler = this.taskHandlers[key];
    if (!registeredHandler)
      throw new Error(`No registered task queue handler with key '${key}'`);
    if (registeredHandler.validate)
      registeredHandler.validate(data);
    const task = createInitialTask(
      key,
      registeredHandler.info(data),
      data
    );
    if (registeredHandler.create)
      await registeredHandler.create(
        task.data,
        new TaskQueueItemContext(
          this.storageManager,
          this.listenerManager,
          this,
          task
        )
      );
    task.status = 1 /* IN_PROGRESS */;
    await registeredHandler.run(
      task.data,
      new TaskQueueItemContext(
        this.storageManager,
        this.listenerManager,
        this,
        task,
        true
      )
    );
    return task.data;
  }
  async add(key, data) {
    const registeredHandler = this.taskHandlers[key];
    if (!registeredHandler)
      throw new Error(`No registered task queue handler with key '${key}'`);
    this.log("A handler with this key does exist");
    if (!isSerializable(data))
      throw new Error("Data must be serializable");
    this.log("Data is serializable");
    if (registeredHandler.validate)
      registeredHandler.validate(data);
    this.log("Data validated OK");
    const task = createInitialTask(
      key,
      registeredHandler.info(data),
      data
    );
    this.log("Task created", task);
    this.storageManager.currentTasks.push(task);
    this.log("Task added to queue");
    if (registeredHandler.create)
      await registeredHandler.create(
        data,
        new TaskQueueItemContext(
          this.storageManager,
          this.listenerManager,
          this,
          task
        )
      );
    this.log("Task prepared");
    await this.storageManager.sync();
    this.log("Storage synced");
    this.listenerManager.call(task);
    this.log("Listeners called");
    return task.id;
  }
  async start() {
    if (this.isRunning)
      throw new Error("Task Queue is already running");
    this.isRunning = true;
    this.onQueueStarted?.();
    while (this.isRunning) {
      const [nextTask] = this.storageManager.currentTasks;
      if (!nextTask || this.isPaused) {
        await sleep(1e3);
        continue;
      }
      nextTask.status = 1 /* IN_PROGRESS */;
      nextTask.attempts++;
      if (!nextTask.startedAt)
        nextTask.startedAt = Date.now();
      try {
        if (!this.taskHandlers[nextTask.key])
          throw new Error(
            `No registered task queue handler with key '${nextTask.key}'`
          );
        await this.taskHandlers[nextTask.key]?.run(
          nextTask.data,
          new TaskQueueItemContext(
            this.storageManager,
            this.listenerManager,
            this,
            nextTask
          )
        );
        nextTask.status = 2 /* FINISHED */;
        nextTask.finishedAt = Date.now();
        this.storageManager.finishedTasks.push(nextTask);
        this.storageManager.currentTasks.shift();
      } catch (e) {
        nextTask.lastMessage = e.message;
        if (!e.fatalError && nextTask.attempts < 3) {
          const delay = (2 ^ nextTask.attempts) + Math.floor(Math.random() * 1e3);
          await sleep(delay);
          nextTask.status = 0 /* QUEUED */;
        } else {
          this.isRunning = false;
          nextTask.status = -1 /* FAILED */;
          this.onQueueStopped?.(
            `Failed on "${nextTask.info.name}" - ${nextTask.lastMessage}`
          );
        }
      }
      await this.storageManager.sync();
      this.listenerManager.call(nextTask);
    }
  }
  stop() {
    this.onQueueStopped?.(`Manually stopped queue`);
    this.isRunning = false;
  }
  pause() {
    this.isPaused = true;
  }
  resume() {
    this.isPaused = false;
  }
  async reducer(key, initialValue, opts) {
    let accumulator = initialValue;
    for (const task of this.storageManager.currentTasks) {
      const registeredHandler = this.taskHandlers[task.key];
      if (registeredHandler?.reducers && registeredHandler.reducers[key]) {
        accumulator = await registeredHandler.reducers[key](
          accumulator,
          task.data,
          new TaskQueueItemContext(
            this.storageManager,
            this.listenerManager,
            this,
            task
          )
        );
      }
    }
    return accumulator;
  }
  plugins(...plugins) {
    for (const plugin of plugins) {
      (async () => {
        if (plugin.storage)
          await this.storageManager.use(plugin.storage);
      })();
    }
  }
  handlers(...handlers) {
    for (const handler of handlers) {
      const key = handler.key();
      this.taskHandlers[key] = handler;
    }
  }
  on(filter, callback) {
    return this.listenerManager.add(callback, filter);
  }
  tasks() {
    return [
      ...this.storageManager.finishedTasks,
      ...this.storageManager.currentTasks
    ];
  }
  async clear() {
    await this.storageManager.removeAll();
  }
};
export {
  TaskQueue,
  TaskQueueItemError,
  TaskQueueItemStatus,
  createTaskQueue
};
