import { Action, Metadata, Validate, Reducer, Start } from "@exogee/kew";

interface ReverseMessageProps {
  message: string;
}

@Metadata("ReverseMessage", {
  friendlyName: ({ message }) => `Reverse Message '${message}'`,
  tags: ["message"],
})
export class ReverseMessage extends Action<ReverseMessageProps> {
  @Validate()
  validate({ message }) {
    if (!message) throw new Error("Missing Message");
  }

  @Start()
  async start() {
    this.props.message = this.props.message.split("").reverse().join("");
  }

  @Reducer("test")
  test_reducer() {
    return this.props.message;
  }
}
