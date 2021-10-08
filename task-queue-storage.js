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
exports.__esModule = true;
exports.TaskQueueStorageManager = void 0;
/** Task Queue Storage Manager */
var TaskQueueStorageManager = /** @class */ (function () {
    function TaskQueueStorageManager() {
        this.currentTasks = [];
        this.finishedTasks = [];
        this.references = {};
        this.storage = {};
    }
    TaskQueueStorageManager.prototype.use = function (storage) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.storage = storage;
                        return [4 /*yield*/, this.load()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    // Write the queue to storage
    TaskQueueStorageManager.prototype.sync = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.storage.sync) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.storage.sync({
                                currentTasks: this.currentTasks,
                                finishedTasks: this.finishedTasks,
                                references: this.references
                            })];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    // Load the queue from storage
    TaskQueueStorageManager.prototype.load = function () {
        return __awaiter(this, void 0, void 0, function () {
            var loaded;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.storage.load) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.storage.load()];
                    case 1:
                        loaded = _a.sent();
                        this.currentTasks =
                            (loaded === null || loaded === void 0 ? void 0 : loaded.currentTasks) && Array.isArray(loaded.currentTasks) ? loaded.currentTasks : [];
                        this.finishedTasks =
                            (loaded === null || loaded === void 0 ? void 0 : loaded.finishedTasks) && Array.isArray(loaded.finishedTasks) ? loaded.finishedTasks : [];
                        this.references =
                            (loaded === null || loaded === void 0 ? void 0 : loaded.references) && !Array.isArray(loaded.references) ? loaded.references : {};
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    // Remove all data
    TaskQueueStorageManager.prototype.removeAll = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.currentTasks = [];
                        this.finishedTasks = [];
                        this.references = {};
                        return [4 /*yield*/, this.sync()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    return TaskQueueStorageManager;
}());
exports.TaskQueueStorageManager = TaskQueueStorageManager;
