import { BaseStore, ImmutableStoreGetter, StoreGetter, db } from 'klayr-sdk';
import { NextAvailableProposalIdStoreData } from '../types';
import { nextAvailableProposalIdStoreSchema } from '../schema';

export const defaultNextId = Object.freeze<NextAvailableProposalIdStoreData>({
	nextProposalId: 0,
});

export class NextAvailableProposalIdStore extends BaseStore<NextAvailableProposalIdStoreData> {
	public async getOrDefault(context: ImmutableStoreGetter): Promise<NextAvailableProposalIdStoreData> {
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

	public async increase(context: StoreGetter) {
		const nextId = await this.getOrDefault(context);
		nextId.nextProposalId += 1;
		await this.set(context, Buffer.alloc(0), nextId);
	}

	public schema = nextAvailableProposalIdStoreSchema;
}
