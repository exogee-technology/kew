import AsyncStorage from "@react-native-async-storage/async-storage";
import type { TaskQueuePlugin } from "@exogee/kew";

/**
 * A kew platform plugin for react native using AsyncStorage
 * Stores the queue data as a serialized JS object in JSON.
 * @param key - The AsyncStorage key to store this queue in.
 */
export const createPlatform = (key: string): TaskQueuePlugin => ({
  storage: {
    load: async (): Promise<any> => {
      return await AsyncStorage.getItem(key)
        .then((tasksJSON: string | null) =>
          tasksJSON ? JSON.parse(tasksJSON) : []
        )
        .catch(() => []);
    },
    async sync(queue: any) {
      await AsyncStorage.setItem(key, JSON.stringify(queue));
    },
  },
});
