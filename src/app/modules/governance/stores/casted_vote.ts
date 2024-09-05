import { BaseStore, ImmutableStoreGetter, StoreGetter, db, utils } from 'klayr-sdk';
import { CastedVoteStoreData } from '../types';
import { castedVoteStoreSchema } from '../schema';

export const defaultVote = Object.freeze<CastedVoteStoreData>({
	activeVote: [],
});

export class CastedVoteStore extends BaseStore<CastedVoteStoreData> {
	public async getOrDefault(context: ImmutableStoreGetter, address: Buffer): Promise<CastedVoteStoreData> {
		try {
			const castedVote = await this.get(context, address);
			return castedVote;
		} catch (error) {
			if (!(error instanceof db.NotFoundError)) {
				throw error;
			}
			// eslint-disable-next-line @typescript-eslint/no-unsafe-call
			return utils.objects.cloneDeep(defaultVote) as CastedVoteStoreData;
		}
	}

	public async removeAllCastedVote(context: StoreGetter, address: Buffer) {
		await this.set(context, address, defaultVote);
	}

	public async removeCastedVoteByProposalId(context: StoreGetter, address: Buffer, proposalId: number) {
		const castedVote = await this.getOrDefault(context, address);

		const indexToRemove = castedVote.activeVote.findIndex(vote => vote.proposalId === proposalId);
		if (indexToRemove !== -1) {
			castedVote.activeVote.splice(indexToRemove, 1);
			await this.set(context, address, castedVote);
		}
	}

	public schema = castedVoteStoreSchema;
}
