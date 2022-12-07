// index.ts
import { Queue, TaskStatus, Logging } from "@exogee/kew";
import { ReverseMessage, reverseMessage } from "./reverse-message";

// Define the action types
interface Actions {
  ReverseMessage: ReverseMessage;
}

// Create a new queue
const queue = new Queue({
  actions: [reverseMessage],
  logging: Logging.DEBUG,
});

// Register an event listener
queue.on(
  (task) => task.status === TaskStatus.FINISHED,
  ({ id, props }) => {
    console.log(`Task ${id} completed: ${props.message}`);
    queue.stop();
  }
);

(async () => {
  // Start queue
  const id = await queue.add("ReverseMessage", { message: "!olleH" });
  console.log("Starting Queue");
  await queue.start();
})();
