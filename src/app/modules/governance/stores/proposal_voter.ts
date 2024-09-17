import { Modules, db, utils } from 'klayr-sdk';
import { ProposalVoterStoreData } from '../types';
import { proposalVoterStoreSchema } from '../schema';
import { numberToBytes } from '../utils';

export const defaultProposalVoters = Object.freeze<ProposalVoterStoreData>({
	voters: [],
});

export class ProposalVoterStore extends Modules.BaseStore<ProposalVoterStoreData> {
	public async getOrDefault(context: Modules.ImmutableStoreGetter, proposalId: number): Promise<ProposalVoterStoreData> {
		try {
			const proposalVoters = await this.get(context, numberToBytes(proposalId));
			return proposalVoters;
		} catch (error) {
			if (!(error instanceof db.NotFoundError)) {
				throw error;
			}
			// eslint-disable-next-line @typescript-eslint/no-unsafe-call
			return utils.objects.cloneDeep(defaultProposalVoters) as ProposalVoterStoreData;
		}
	}

	public async addVoter(context: Modules.StoreGetter, proposalId: number, address: Buffer) {
		const proposalVoters = await this.getOrDefault(context, proposalId);
		const index = proposalVoters.voters.findIndex(voter => voter.equals(address));
		if (index === -1) {
			proposalVoters.voters.push(address);
			await this.set(context, numberToBytes(proposalId), proposalVoters);
		}
	}

	public schema = proposalVoterStoreSchema;
}
