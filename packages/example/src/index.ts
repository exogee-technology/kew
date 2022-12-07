// index.ts
import { createTaskQueue, TaskStatus } from "@exogee/kew";
import { ReverseMessage, reverseMessage } from "./reverse-message";

// Define the action types
interface Actions {
  ReverseMessage: ReverseMessage;
}

// Create a new typed queue
const queue = createTaskQueue({
  actions: [reverseMessage],
});

// Register an event listener
queue.on(
  (task) => task.status === TaskStatus.FINISHED,
  ({ props }) => {
    console.log("Task completed: ", props);
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
