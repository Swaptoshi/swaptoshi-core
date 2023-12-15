import { BaseStore, ImmutableStoreGetter, StoreGetter, db } from 'lisk-sdk';
import { FactoryStoreData } from '../types';
import { factoryStoreSchema } from '../schema/stores/factory';

export class FactoryStore extends BaseStore<FactoryStoreData> {
	public async getOrDefault(context: ImmutableStoreGetter, key: Buffer): Promise<FactoryStoreData> {
		try {
			const factory = await this.get(context, key);
			return factory;
		} catch (error) {
			if (!(error instanceof db.NotFoundError)) {
				throw error;
			}
			return { owner: Buffer.alloc(0) };
		}
	}

	public async getOrUndefined(
		context: ImmutableStoreGetter,
		key: Buffer,
	): Promise<FactoryStoreData | undefined> {
		try {
			const factory = await this.get(context, key);
			return factory;
		} catch (error) {
			if (!(error instanceof db.NotFoundError)) {
				throw error;
			}
			return undefined;
		}
	}

	public async register(context: StoreGetter, tokenId: Buffer, owner: Buffer): Promise<void> {
		if (await this.has(context, tokenId))
			throw new Error(`factory for ${tokenId.toString('hex')} already registered`);
		await this.set(context, tokenId, { owner });
	}

	public schema = factoryStoreSchema;
}
