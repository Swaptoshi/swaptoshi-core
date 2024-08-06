import { Votes } from '../enum';

export interface ProposalStoreData {
	title: string;
	summary: string;
	deposited: bigint;
	author: Buffer;
	createdHeight: number;
	status: number;
	actions: ProposalActions[];
	votes: {
		address: Buffer;
		votes: Votes;
	}[];
	attributes: ProposalAttributes[];
}

export interface ProposalActions {
	type: 'funding' | 'config';
	payload: Buffer;
}

export interface ProposalAttributes {
	key: string;
	data: Buffer;
}
