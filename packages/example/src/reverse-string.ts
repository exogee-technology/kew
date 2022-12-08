import { Action, Metadata, Reducer, Step } from "@exogee/kew";

interface ReverseMessageProps {
  value: string;
  timestamp?: number;
}

@Metadata("ReverseString", {
  friendlyName: "Reverse A String",
  tags: ["message"],
})
export class ReverseString extends Action<ReverseMessageProps> {
  validate() {
    if (!this.props.value) throw new Error("Missing value");
  }

  async create() {
    this.props.timestamp = Date.now();
  }

  @Step()
  async start() {
    this.props.value = this.props.value.split("").reverse().join("");
  }

  @Reducer("test")
  test_reducer(acc: any) {
    return !acc
      ? `Reversing ${this.props.value}`
      : `${acc} and ${this.props.value}`;
  }
}
