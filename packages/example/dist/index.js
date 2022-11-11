"use strict";
import { createTaskQueue, TaskQueueItemStatus } from "@exogee/kew";
import { reverseMessage } from "./reverse-message";
const queue = createTaskQueue({
  handlers: [reverseMessage]
});
queue.on(
  (task) => task.status === TaskQueueItemStatus.FINISHED,
  ({ data }) => {
    console.log("Task completed: ", data);
    queue.stop();
  }
);
(async () => {
  const id = await queue.add("ReverseMessage", { message: "!olleH" });
  console.log("Added task to queue id ", id);
  console.log("Starting Queue");
  await queue.start();
})();
