"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskQueueItemError = exports.TaskQueueItemStatus = void 0;
/** The current status of a task */
var TaskQueueItemStatus;
(function (TaskQueueItemStatus) {
    TaskQueueItemStatus[TaskQueueItemStatus["FAILED"] = -1] = "FAILED";
    TaskQueueItemStatus[TaskQueueItemStatus["QUEUED"] = 0] = "QUEUED";
    TaskQueueItemStatus[TaskQueueItemStatus["IN_PROGRESS"] = 1] = "IN_PROGRESS";
    TaskQueueItemStatus[TaskQueueItemStatus["FINISHED"] = 2] = "FINISHED";
})(TaskQueueItemStatus = exports.TaskQueueItemStatus || (exports.TaskQueueItemStatus = {}));
/** Error returned by task queue */
class TaskQueueItemError extends Error {
    constructor(message, fatalError) {
        super(message);
        this.fatalError = fatalError;
    }
}
exports.TaskQueueItemError = TaskQueueItemError;
