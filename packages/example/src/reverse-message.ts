// SendMessage.ts
import { TaskQueueHandler } from "../index";

// Define the ReverseMessage Task Handler Event
export interface ReverseMessage {
  message: string;
}

// Define the SendMessage Task Handler
export const reverseMessage: TaskQueueHandler<ReverseMessage> = {
  key: () => "ReverseMessage",
  info: ({ message }) => ({
    friendlyName: `Reverse Message: ${message}`,
    tags: ["message"],
  }),
  validate: ({ message }) => {
    if (!message) throw new Error("Missing Message");
  },
  run: async ({ message }, { setTaskData }) => {
    await setTaskData({ message: message.split("").reverse().join("") });
  },
};
