// index.ts
import { createTaskQueue, TaskQueueItemStatus } from "@exogee/kew";
import { ReverseMessage, reverseMessage } from "./reverse-message";

// Define the data types for handlers
interface TaskHandlers {
  ReverseMessage: ReverseMessage;
}

// Create a new typed queue
const queue = createTaskQueue<TaskHandlers>({
  handlers: [reverseMessage],
});

// Register an event listener
queue.on(
  (task) => task.status === TaskQueueItemStatus.FINISHED,
  ({ data }) => {
    console.log("Task completed: ", data);
    queue.stop();
  }
);

(async () => {
  // Start queue
  const id = await queue.add("ReverseMessage", { message: "!olleH" });
  console.log("Added task to queue id ", id);
  console.log("Starting Queue");
  await queue.start();
})();
