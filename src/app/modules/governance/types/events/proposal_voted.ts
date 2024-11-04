import { Votes } from '../enum';

export interface ProposalVotedEventData {
	proposalId: number;
	voterAddress: Buffer;
	decision: Votes;
	data: string;
}
