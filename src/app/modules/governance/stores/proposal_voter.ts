import { BaseStore, ImmutableStoreGetter, StoreGetter, db } from 'klayr-sdk';
import { ProposalVoterStoreData } from '../types';
import { proposalVoterStoreSchema } from '../schema';
import { numberToBytes } from '../utils';

export const defaultProposalVoters = Object.freeze<ProposalVoterStoreData>({
	voters: [],
});

export class ProposalVoterStore extends BaseStore<ProposalVoterStoreData> {
	public async getOrDefault(context: ImmutableStoreGetter, proposalId: number): Promise<ProposalVoterStoreData> {
		try {
			const proposalVoters = await this.get(context, numberToBytes(proposalId));
			return proposalVoters;
		} catch (error) {
			if (!(error instanceof db.NotFoundError)) {
				throw error;
			}
			return { ...defaultProposalVoters };
		}
	}

	public async addVoter(context: StoreGetter, proposalId: number, address: Buffer) {
		const proposalVoters = await this.getOrDefault(context, proposalId);
		const index = proposalVoters.voters.findIndex(voter => voter.equals(address));
		if (index === -1) {
			proposalVoters.voters.push(address);
			await this.set(context, numberToBytes(proposalId), proposalVoters);
		}
	}

	public schema = proposalVoterStoreSchema;
}
