import { BaseStore, ImmutableStoreGetter, StoreGetter, db } from 'klayr-sdk';
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
			return { ...defaultVote };
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

	public async setAllCastedVoteBoostingHeight(context: StoreGetter, address: Buffer, boostingHeight: number) {
		const castedVote = await this.getOrDefault(context, address);

		for (const vote of castedVote.activeVote) {
			vote.boostingHeight = boostingHeight;
		}

		await this.set(context, address, castedVote);
	}

	public schema = castedVoteStoreSchema;
}
