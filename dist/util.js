"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createInitialTask = exports.sleep = exports.isSerializable = void 0;
const types_1 = require("./types");
const uuid_1 = require("uuid");
const isSerializable = (data) => {
    try {
        JSON.stringify(data);
        return true;
    }
    catch (e) {
        return false;
    }
};
exports.isSerializable = isSerializable;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
exports.sleep = sleep;
const createInitialTask = (key, info, data) => {
    return {
        // @ts-ignore @todo
        key,
        data,
        info,
        status: types_1.TaskQueueItemStatus.QUEUED,
        id: uuid_1.v4(),
        submittedAt: Date.now(),
        progress: 0,
        attempts: 0
    };
};
exports.createInitialTask = createInitialTask;
