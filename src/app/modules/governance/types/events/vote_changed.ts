import { Votes } from '../enum';

export interface VoteChangedEventData {
	proposalId: number;
	voterAddress: Buffer;
	oldDecision: Votes;
	newDecision: Votes;
	data: string;
}
