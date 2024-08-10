import { BaseStore, ImmutableStoreGetter, StoreGetter, db } from 'klayr-sdk';
import { VoteScoreStoreData } from '../types';
import { voteScoreStoreSchema } from '../schema';

export class VoteScoreStore extends BaseStore<VoteScoreStoreData> {
	public async getVoteScore(context: ImmutableStoreGetter, address: Buffer): Promise<bigint> {
		try {
			const voteScore = await this.get(context, address);
			return voteScore.score;
		} catch (error) {
			if (!(error instanceof db.NotFoundError)) {
				throw error;
			}
			return BigInt(0);
		}
	}

	public async addVoteScore(context: StoreGetter, address: Buffer, addedVote: bigint): Promise<void> {
		const voteScore = await this.getVoteScore(context, address);
		await this.set(context, address, { score: voteScore + addedVote });
	}

	public schema = voteScoreStoreSchema;
}
