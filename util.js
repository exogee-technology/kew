"use strict";
exports.__esModule = true;
exports.createInitialTask = exports.sleep = exports.isSerializable = void 0;
var types_1 = require("./types");
var uuid_1 = require("uuid");
var isSerializable = function (data) {
    try {
        JSON.stringify(data);
        return true;
    }
    catch (e) {
        return false;
    }
};
exports.isSerializable = isSerializable;
var sleep = function (ms) {
    return new Promise(function (resolve) { return setTimeout(resolve, ms); });
};
exports.sleep = sleep;
var createInitialTask = function (key, info, data) {
    return {
        key: key,
        data: data,
        info: info,
        status: types_1.TaskQueueItemStatus.QUEUED,
        id: uuid_1.v4(),
        submittedAt: Date.now(),
        progress: 0,
        attempts: 0
    };
};
exports.createInitialTask = createInitialTask;
