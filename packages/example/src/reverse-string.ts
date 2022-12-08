import { Action, Metadata, Reducer, Start } from "@exogee/kew";

interface ReverseMessageProps {
  value: string;
}

@Metadata("ReverseString", {
  friendlyName: ({ value }) => `Reverse the string '${value}'`,
  tags: ["message"],
})
export class ReverseString extends Action<ReverseMessageProps> {
  static validate({ value }) {
    if (!value) throw new Error("Missing value");
  }

  static create(props) {
    return props;
  }

  @Start()
  async start() {
    this.props.value = this.props.value.split("").reverse().join("");
  }

  @Reducer("test")
  test_reducer(acc) {
    return !acc
      ? `Reversing ${this.props.value}`
      : `${acc} and ${this.props.value}`;
  }
}
