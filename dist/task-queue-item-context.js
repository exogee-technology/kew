"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskQueueItemContext = void 0;
const uuid_1 = require("uuid");
/** Task Queue Item Context Manager */
class TaskQueueItemContext {
    constructor(storageManager, eventEmitterManager, taskQueue, task) {
        // Update the task data
        this.setTaskData = async (data) => {
            this.task.data = { ...this.task.data, ...data };
            this.eventEmitterManager.call(this.task);
            await this.storageManager.sync();
        };
        // Change the task progress
        this.setProgress = async (progress) => {
            this.task.progress = progress;
            this.eventEmitterManager.call(this.task);
            await this.storageManager.sync();
        };
        // Create a new unique ID
        this.createId = () => {
            return uuid_1.v4();
        };
        // Return the full raw task data
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
}
exports.TaskQueueItemContext = TaskQueueItemContext;
