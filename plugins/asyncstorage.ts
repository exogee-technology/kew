import AsyncStorage from '@react-native-async-storage/async-storage';
import { TaskQueuePlugin } from '../types';

/**
 * A Task Queue Storage Plugin for React-Native AsyncStorage
 * Stores the queue data as a serialized JS object in JSON.
 * @param key - The AsyncStorage key to store this queue in.
 */
export const asyncStoragePlugin = (key: string): TaskQueuePlugin => ({
	storage: {
		async load() {
			return await AsyncStorage.getItem(key)
				.then((tasksJSON: string | null) => tasksJSON ? JSON.parse(tasksJSON) : [])
				.catch(() => []);
		},
		async sync(queue) {
			await AsyncStorage.setItem(key, JSON.stringify(queue));
		},
	},
});