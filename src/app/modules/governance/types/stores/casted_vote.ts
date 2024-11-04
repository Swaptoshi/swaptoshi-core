import { Votes } from '../enum';

export interface CastedVoteStoreData {
	activeVote: {
		proposalId: number;
		decision: Votes;
		data: string;
	}[];
}
