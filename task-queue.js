"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from) {
    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
    return to;
};
exports.__esModule = true;
exports.TaskQueue = exports.createTaskQueue = void 0;
var types_1 = require("./types");
var task_queue_storage_1 = require("./task-queue-storage");
var task_queue_item_context_1 = require("./task-queue-item-context");
var task_queue_event_emitter_1 = require("./task-queue-event-emitter");
var util_1 = require("./util");
/** Convenience helper to create a new task queue with plugins and handlers */
var createTaskQueue = function (_a) {
    var plugins = _a.plugins, handlers = _a.handlers;
    var queue = new TaskQueue();
    plugins && queue.plugins.apply(queue, plugins);
    handlers && queue.handlers.apply(queue, handlers);
    return queue;
};
exports.createTaskQueue = createTaskQueue;
/**
 * kew Task Queue Implementation
 * TH: Task Queue Handlers interface
 * TR: Task Queue Reducers interface
 * */
var TaskQueue = /** @class */ (function () {
    function TaskQueue() {
        this.taskHandlers = {};
        this.storageManager = new task_queue_storage_1.TaskQueueStorageManager();
        this.listenerManager = new task_queue_event_emitter_1.TaskQueueEventEmitterManager(this.storageManager);
        this.isRunning = false;
    }
    TaskQueue.prototype.log = function (message, data) {
        console.log('kew: ', message, data);
    };
    /**
     * Run a task immediately without adding to the queue
     * @param key - A string that represents the type of task to perform.
     * @param data - Any data items required by the task handler.
     */
    TaskQueue.prototype.run = function (key, data) {
        return __awaiter(this, void 0, void 0, function () {
            var registeredHandler, task;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        registeredHandler = this.taskHandlers[key];
                        if (!registeredHandler)
                            throw new Error("No registered task queue handler with key '" + key + "'");
                        // If the handler has a validateTask method, run it to check the taskData
                        if (registeredHandler.validate)
                            registeredHandler.validate(data);
                        task = util_1.createInitialTask(key, registeredHandler.info(data), data);
                        if (!registeredHandler.create) return [3 /*break*/, 2];
                        return [4 /*yield*/, registeredHandler.create(task.data, new task_queue_item_context_1.TaskQueueItemContext(this.storageManager, this.listenerManager, task))];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        // Run the task with task data and context
                        task.status = types_1.TaskQueueItemStatus.IN_PROGRESS;
                        return [4 /*yield*/, registeredHandler.run(task.data, new task_queue_item_context_1.TaskQueueItemContext(this.storageManager, this.listenerManager, task))];
                    case 3:
                        _a.sent();
                        // Return the task data at the end
                        return [2 /*return*/, task.data];
                }
            });
        });
    };
    /**
     * Add a new task to the queue.
     * @param key - A string that represents the type of handler to use.
     * @param data - Any data items required by the handler.
     * @returns Promise<string> A Unique Task ID
     * */
    TaskQueue.prototype.add = function (key, data) {
        return __awaiter(this, void 0, void 0, function () {
            var registeredHandler, task;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        registeredHandler = this.taskHandlers[key];
                        if (!registeredHandler)
                            throw new Error("No registered task queue handler with key '" + key + "'");
                        this.log("A handler with this key does exist");
                        // Check that data is serializable
                        if (!util_1.isSerializable(data))
                            throw new Error('Data must be serializable');
                        this.log("Data is serializable");
                        // If the handler has a validate method, run it to check the taskData
                        if (registeredHandler.validate)
                            registeredHandler.validate(data);
                        this.log("Data validated OK");
                        task = util_1.createInitialTask(key, registeredHandler.info(data), data);
                        this.log("Task created", task);
                        // Push task on to the queue
                        this.storageManager.currentTasks.push(task);
                        this.log("Task added to queue");
                        if (!registeredHandler.create) return [3 /*break*/, 2];
                        return [4 /*yield*/, registeredHandler.create(data, new task_queue_item_context_1.TaskQueueItemContext(this.storageManager, this.listenerManager, task))];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        this.log("Task prepared");
                        // Persist to storage
                        return [4 /*yield*/, this.storageManager.sync()];
                    case 3:
                        // Persist to storage
                        _a.sent();
                        this.log("Storage synced");
                        // Call event listeners
                        this.listenerManager.call(task);
                        this.log("Listeners called");
                        // Return the generated task ID
                        return [2 /*return*/, task.id];
                }
            });
        });
    };
    /** Run all tasks in the queue */
    TaskQueue.prototype.start = function () {
        return __awaiter(this, void 0, void 0, function () {
            var nextTask, e_1, delay;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.isRunning)
                            throw new Error("Task Queue is already running");
                        this.isRunning = true;
                        _a.label = 1;
                    case 1:
                        if (!this.isRunning) return [3 /*break*/, 12];
                        if (!(!this.storageManager.currentTasks ||
                            !Array.isArray(this.storageManager.currentTasks) ||
                            this.storageManager.currentTasks.length < 1)) return [3 /*break*/, 3];
                        return [4 /*yield*/, util_1.sleep(1000)];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 1];
                    case 3:
                        nextTask = this.storageManager.currentTasks[0];
                        nextTask.status = types_1.TaskQueueItemStatus.IN_PROGRESS;
                        nextTask.attempts++;
                        if (!nextTask.startedAt)
                            nextTask.startedAt = Date.now();
                        _a.label = 4;
                    case 4:
                        _a.trys.push([4, 6, , 10]);
                        // Run the task with task data and context
                        return [4 /*yield*/, this.taskHandlers[nextTask.key].run(nextTask.data, new task_queue_item_context_1.TaskQueueItemContext(this.storageManager, this.listenerManager, nextTask))];
                    case 5:
                        // Run the task with task data and context
                        _a.sent();
                        // If we got here, the task completed with success
                        nextTask.status = types_1.TaskQueueItemStatus.FINISHED;
                        nextTask.finishedAt = Date.now();
                        this.storageManager.finishedTasks.push(nextTask);
                        this.storageManager.currentTasks.shift();
                        return [3 /*break*/, 10];
                    case 6:
                        e_1 = _a.sent();
                        nextTask.lastMessage = e_1.message;
                        if (!(!e_1.fatalError && nextTask.attempts < 3)) return [3 /*break*/, 8];
                        delay = (2 ^ nextTask.attempts) + Math.floor(Math.random() * 1000);
                        return [4 /*yield*/, util_1.sleep(delay)];
                    case 7:
                        _a.sent();
                        nextTask.status = types_1.TaskQueueItemStatus.QUEUED;
                        return [3 /*break*/, 9];
                    case 8:
                        // For permanent failure, unknown failures, and after three retries, stop the queue
                        this.isRunning = false;
                        nextTask.status = types_1.TaskQueueItemStatus.FAILED;
                        _a.label = 9;
                    case 9: return [3 /*break*/, 10];
                    case 10: 
                    // Persist queue
                    return [4 /*yield*/, this.storageManager.sync()];
                    case 11:
                        // Persist queue
                        _a.sent();
                        // Call event listeners
                        this.listenerManager.call(nextTask);
                        return [3 /*break*/, 1];
                    case 12: return [2 /*return*/];
                }
            });
        });
    };
    /** Stop a currently running queue */
    TaskQueue.prototype.stop = function () {
        this.isRunning = false;
    };
    /**
     * Run a reduce over the queue
     * @param key: A named reducer string, or a custom function to run over each task.
     * @param initialValue: The initial value to use as the accumulator.
     */
    TaskQueue.prototype.reducer = function (key, initialValue) {
        return __awaiter(this, void 0, void 0, function () {
            var accumulator, _i, _a, task, registeredHandler;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        accumulator = initialValue;
                        _i = 0, _a = this.storageManager.currentTasks;
                        _b.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3 /*break*/, 4];
                        task = _a[_i];
                        registeredHandler = this.taskHandlers[task.key];
                        if (!((registeredHandler === null || registeredHandler === void 0 ? void 0 : registeredHandler.reducers) && registeredHandler.reducers[key])) return [3 /*break*/, 3];
                        return [4 /*yield*/, registeredHandler.reducers[key](accumulator, task.data, new task_queue_item_context_1.TaskQueueItemContext(this.storageManager, this.listenerManager, task).getContext())];
                    case 2:
                        accumulator = _b.sent();
                        _b.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/, accumulator];
                }
            });
        });
    };
    /**
     * Attach a new plugin to the queue
     * @param plugins - One or more plugins
     */
    TaskQueue.prototype.plugins = function () {
        var _this = this;
        var plugins = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            plugins[_i] = arguments[_i];
        }
        var _loop_1 = function (plugin) {
            (function () { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!plugin.storage) return [3 /*break*/, 2];
                            return [4 /*yield*/, this.storageManager.use(plugin.storage)];
                        case 1:
                            _a.sent();
                            _a.label = 2;
                        case 2: return [2 /*return*/];
                    }
                });
            }); })();
        };
        for (var _a = 0, plugins_1 = plugins; _a < plugins_1.length; _a++) {
            var plugin = plugins_1[_a];
            _loop_1(plugin);
        }
    };
    /**
     * Register a new task handler.
     * @param handlers - One or more task handlers
     */
    TaskQueue.prototype.handlers = function () {
        var handlers = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            handlers[_i] = arguments[_i];
        }
        for (var _a = 0, handlers_1 = handlers; _a < handlers_1.length; _a++) {
            var handler = handlers_1[_a];
            var key = handler.key();
            this.taskHandlers[key] = handler;
        }
    };
    /**
     * Register a callback on a given filter
     * @todo add on log, on stop
     * @param filter - A filter to use on the task.
     * @param callback - A method that is called when the listener condition is triggered
     */
    TaskQueue.prototype.on = function (filter, callback) {
        return this.listenerManager.add(callback, filter);
    };
    /** Get all tasks */
    TaskQueue.prototype.tasks = function () {
        return __spreadArray(__spreadArray([], this.storageManager.currentTasks), this.storageManager.finishedTasks);
    };
    /** Clear queue */
    TaskQueue.prototype.clear = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.storageManager.removeAll()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    return TaskQueue;
}());
exports.TaskQueue = TaskQueue;
