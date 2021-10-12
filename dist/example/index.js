"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// index.ts
const index_1 = require("../index");
const reverse_message_1 = require("./reverse-message");
// Create a new typed queue
const queue = index_1.createTaskQueue({
    handlers: [reverse_message_1.reverseMessage]
});
// Register an event listener
queue.on((task) => task.status === index_1.TaskQueueItemStatus.FINISHED, ({ data }) => {
    console.log("Task completed: ", data);
    queue.stop();
});
(async () => {
    // Start queue
    const id = await queue.add('ReverseMessage', { message: "!olleH" });
    console.log("Added task to queue id ", id);
    console.log("Starting Queue");
    await queue.start();
})();
