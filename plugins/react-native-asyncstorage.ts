import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueuePlugin } from '../types';

/**
 * A Task Queue Storage Plugin for React-Native AsyncStorage
 * Stores the queue data as a serialized JS object in JSON.
 * @param storageKey - The AsyncStorage key to store this queue in.
 * @constructor
 */
export const ReactNativeAsyncStoragePlugin = (storageKey: string): QueuePlugin => ({
	storage: {
		async load() {
			return await AsyncStorage.getItem(storageKey)
				.then((tasksJSON: string | null) => tasksJSON ? JSON.parse(tasksJSON) : [])
				.catch(() => []);
		},
		async sync(queue) {
			await AsyncStorage.setItem(storageKey, JSON.stringify(queue));
		},
	},
});
