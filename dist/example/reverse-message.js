"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reverseMessage = void 0;
// Define the SendMessage Task Handler
exports.reverseMessage = {
    key: () => "ReverseMessage",
    info: ({ message }) => ({
        friendlyName: `Reverse Message: ${message}`,
        tags: ['message']
    }),
    validate: ({ message }) => {
        if (!message)
            throw new Error("Missing Message");
    },
    run: async ({ message }, { setTaskData }) => {
        await setTaskData({ message: message.split('').reverse().join('') });
    }
};
