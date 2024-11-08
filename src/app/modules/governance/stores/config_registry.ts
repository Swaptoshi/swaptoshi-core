import { Modules, db } from 'klayr-sdk';
import { ConfigRegistryStoreData } from '../types';
import { configRegistryStoreSchema } from '../schema';

export class ConfigRegistryStore extends Modules.BaseStore<ConfigRegistryStoreData> {
	public async getOrDefault(context: Modules.ImmutableStoreGetter): Promise<ConfigRegistryStoreData> {
		try {
			const castedVote = await this.get(context, Buffer.alloc(0));
			return castedVote;
		} catch (error) {
			if (!(error instanceof db.NotFoundError)) {
				throw error;
			}
			// eslint-disable-next-line @typescript-eslint/no-unsafe-call
			return { registry: [] };
		}
	}

	public async register(context: Modules.StoreGetter, module: string, index: number) {
		const store = await this.getOrDefault(context);
		const registryIndex = store.registry.findIndex(t => t.module === module);
		if (registryIndex === -1) {
			store.registry.push({ module, index });
			store.registry.sort((a, b) => {
				if (a.module > b.module) return -1;
				if (b.module > a.module) return 1;
				return 0;
			});
		}
		await this.set(context, Buffer.alloc(0), store);
	}

	public schema = configRegistryStoreSchema;
}
