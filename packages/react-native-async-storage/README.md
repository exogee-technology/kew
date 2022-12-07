# @exogee/kew-react-native-async-storage

A platform for `@exogee/kew` for react-native that uses async-storage

## Usage

```ts
import { Platform } from "@exogee/kew-react-native-async-storage";
import { Queue } from "@exogee/kew";

const queue = new Queue({
  platform: new Platform("my_application_queue"),
});
```
