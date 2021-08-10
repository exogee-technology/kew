import { QueueStoragePlugin, Reference, Task } from './types';

/**
 * Storage Manager
 * Manage storage load/sync in the queue
 */
export class QueueStorageManager {
	currentTasks: Task<any>[] = [];
	finishedTasks: Task<any>[] = [];
	references: { [key: string]: Reference<any> } = {};

	protected storage: QueueStoragePlugin = {};

	async use(storage: QueueStoragePlugin) {
		this.storage = storage;
		await this.load();
	}

	// Write the queue to storage
	async sync() {
		if (this.storage.sync) {
			await this.storage.sync({
				currentTasks: this.currentTasks,
				finishedTasks: this.finishedTasks,
				references: this.references,
			});
		}
	}

	// Load the queue from storage
	async load() {
		if (this.storage.load) {
			const loaded = await this.storage.load();

			this.currentTasks =
				loaded?.currentTasks && Array.isArray(loaded.currentTasks) ? loaded.currentTasks : [];
			this.finishedTasks =
				loaded?.finishedTasks && Array.isArray(loaded.finishedTasks) ? loaded.finishedTasks : [];
			this.references =
				loaded?.references && !Array.isArray(loaded.references) ? loaded.references : {};
		}
	}

	// Remove all data
	async removeAll() {
		this.currentTasks = [];
		this.finishedTasks = [];
		this.references = {};
		await this.sync();
	}
}
