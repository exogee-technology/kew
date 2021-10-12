"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncStoragePlugin = void 0;
const async_storage_1 = __importDefault(require("@react-native-async-storage/async-storage"));
/**
 * A Task Queue Storage Plugin for React-Native AsyncStorage
 * Stores the queue data as a serialized JS object in JSON.
 * @param key - The AsyncStorage key to store this queue in.
 */
const asyncStoragePlugin = (key) => ({
    storage: {
        async load() {
            return await async_storage_1.default.getItem(key)
                .then((tasksJSON) => tasksJSON ? JSON.parse(tasksJSON) : [])
                .catch(() => []);
        },
        async sync(queue) {
            await async_storage_1.default.setItem(key, JSON.stringify(queue));
        },
    },
});
exports.asyncStoragePlugin = asyncStoragePlugin;
