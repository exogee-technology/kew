import AsyncStorage from "@react-native-async-storage/async-storage";
import type { PlatformInterface } from "@exogee/kew";

/**
 * A kew platform plugin for react native using AsyncStorage
 * Stores the queue data as a serialized JS object in JSON.
 * @param key - The AsyncStorage key to store this queue in.
 */
export class Platform implements PlatformInterface {
  constructor(protected key: string) {}

  async load(): Promise<any> {
    try {
      const tasksJSON = await AsyncStorage.getItem(this.key);
      if (tasksJSON) return JSON.parse(tasksJSON);
    } finally {
    }
    return [];
  }

  async sync(data: any) {
    const tasksJSON = JSON.stringify(data);
    await AsyncStorage.setItem(this.key, tasksJSON);
  }
}
