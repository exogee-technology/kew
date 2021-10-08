"use strict";
exports.__esModule = true;
exports.TaskQueueEventEmitterManager = void 0;
/** Task Queue Event Emitter Manager */
var TaskQueueEventEmitterManager = /** @class */ (function () {
    function TaskQueueEventEmitterManager(storageManager) {
        this.listeners = [];
        this.storageManager = storageManager;
    }
    /**
     * Add a listener to the manager
     * @param callback
     * @param filter
     */
    TaskQueueEventEmitterManager.prototype.add = function (callback, filter) {
        var _this = this;
        this.listeners.push({
            filter: filter,
            callback: callback
        });
        return {
            remove: function () { return _this.remove(callback); }
        };
    };
    /**
     * Remove a listener from the manager
     * @param callback
     */
    TaskQueueEventEmitterManager.prototype.remove = function (callback) {
        this.listeners = this.listeners.filter(function (listener) { return listener.callback === callback; });
    };
    /**
     * Call all registered task event listeners for a given task
     * @param task
     */
    TaskQueueEventEmitterManager.prototype.call = function (task) {
        for (var _i = 0, _a = this.listeners; _i < _a.length; _i++) {
            var listener = _a[_i];
            if (listener.filter(task))
                listener.callback(task);
        }
    };
    return TaskQueueEventEmitterManager;
}());
exports.TaskQueueEventEmitterManager = TaskQueueEventEmitterManager;
