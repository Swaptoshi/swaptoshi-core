import { BaseStore, ImmutableStoreGetter, StoreGetter, db } from 'lisk-sdk';
import { NextAvailableTokenId } from '../types';
import { nextTokenIdStoreSchema } from '../schema/stores/next_available_token_id';

export const defaultNextId: NextAvailableTokenId = Object.freeze({
	nextTokenId: BigInt(1),
});

export class NextAvailableTokenIdStore extends BaseStore<NextAvailableTokenId> {
	public async getOrDefault(context: ImmutableStoreGetter): Promise<NextAvailableTokenId> {
		try {
			const nextAvailableId = await this.get(context, Buffer.alloc(0));
			return nextAvailableId;
		} catch (error) {
			if (!(error instanceof db.NotFoundError)) {
				throw error;
			}
			return { ...defaultNextId };
		}
	}

	public async increment(context: StoreGetter): Promise<void> {
		const state = await this.getOrDefault(context);
		state.nextTokenId += BigInt(1);
		await this.set(context, Buffer.alloc(0), state);
	}

	public schema = nextTokenIdStoreSchema;
}
