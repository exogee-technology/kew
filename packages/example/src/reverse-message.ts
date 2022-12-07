// SendMessage.ts
import { Action } from "@exogee/kew";

// Define the ReverseMessage Task Handler Event
export interface ReverseMessage {
  message: string;
}

// Define the SendMessage Task Handler
export const reverseMessage: Action = {
  key: () => "ReverseMessage",
  metadata: ({ message }) => ({
    friendlyName: `Reverse Message: ${message}`,
    tags: ["message"],
  }),
  validate: ({ message }) => {
    if (!message) throw new Error("Missing Message");
  },
  run: async ({ message }, { setProps }) => {
    await setProps({ message: message.split("").reverse().join("") });
  },
};
