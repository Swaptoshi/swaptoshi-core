import { BaseStore, ImmutableStoreGetter, db, utils } from 'klayr-sdk';
import { NextAvailableTokenIdStoreData } from '../types';
import { nextAvailableTokenIdStoreSchema } from '../schema';

export const defaultNextId = Object.freeze<NextAvailableTokenIdStoreData>({
	nextTokenId: BigInt(1),
});

export class NextAvailableTokenIdStore extends BaseStore<NextAvailableTokenIdStoreData> {
	public async getOrDefault(context: ImmutableStoreGetter): Promise<NextAvailableTokenIdStoreData> {
		try {
			const nextAvailableId = await this.get(context, Buffer.alloc(0));
			return nextAvailableId;
		} catch (error) {
			if (!(error instanceof db.NotFoundError)) {
				throw error;
			}
			// eslint-disable-next-line @typescript-eslint/no-unsafe-call
			return utils.objects.cloneDeep(defaultNextId) as NextAvailableTokenIdStoreData;
		}
	}

	public schema = nextAvailableTokenIdStoreSchema;
}
