import { QuorumMode } from '../enum';

export interface ProposalStoreData {
	title: string;
	summary: string;
	deposited: bigint;
	author: Buffer;
	turnout: {
		for: bigint;
		against: bigint;
		abstain: bigint;
	};
	parameters: {
		createdHeight: number;
		startHeight: number;
		quorumHeight: number;
		endHeight: number;
		executionHeight: number;
		maxBoostDuration: number;
		boostFactor: number;
		enableBoosting: boolean;
		enableTurnoutBias: boolean;
		quorumMode: QuorumMode;
		quorumTreshold: string;
	};
	voteSummary: {
		for: bigint;
		against: bigint;
		abstain: bigint;
	};
	status: number;
	actions: ProposalActions[];
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
