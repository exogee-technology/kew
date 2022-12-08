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
  const id1 = await queue.add("ReverseString", { value: "olleH" });
  const id2 = await queue.add("ReverseString", { value: "eybdooG" });

  console.log("Run Reducer:");
  console.log(await queue.reducer("test", ""));

  console.log("Starting Queue");
  await queue.start();
})();
