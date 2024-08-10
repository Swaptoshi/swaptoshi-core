import { Votes } from '../enum';

export interface CastedVoteStoreData {
	activeVote: {
		proposalId: number;
		boostingHeight: number;
		decision: Votes;
	}[];
}
