"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
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
var TaskQueueItemError = /** @class */ (function (_super) {
    __extends(TaskQueueItemError, _super);
    function TaskQueueItemError(message, fatalError) {
        var _this = _super.call(this, message) || this;
        _this.fatalError = fatalError;
        return _this;
    }
    return TaskQueueItemError;
}(Error));
exports.TaskQueueItemError = TaskQueueItemError;
