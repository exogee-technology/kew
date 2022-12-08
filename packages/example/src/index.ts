// index.ts
import { Queue, TaskStatus, Logging } from "@exogee/kew";
import { ReverseMessage } from "./reverse-message";

// Create a new queue
const queue = new Queue({
  actions: [ReverseMessage],
  logging: Logging.DEBUG,
});

// Register an event listener
queue.on(
  (task) => task.status === TaskStatus.FINISHED,
  (task) => {
    console.log(`Task ${task.id} completed: ${task.props.message}`);
    console.log(JSON.stringify(task));

    queue.stop();
  }
);

// Register an event listener
queue.on(
  (task) => task.status === TaskStatus.FAILED,
  (task) => {
    console.log(`Task ${task.id} failed`);
    console.log(JSON.stringify(task));
    queue.stop();
  }
);

(async () => {
  // Start queue
  const id = await queue.add("ReverseMessage", { message: "!olleH" });
  console.log("Starting Queue");
  await queue.start();
})();
