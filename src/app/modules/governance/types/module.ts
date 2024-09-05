import { FeeMethod, TokenMethod } from 'klayr-sdk';

export interface GovernanceModuleDependencies {
	tokenMethod: TokenMethod;
	feeMethod: FeeMethod;
}

export type VoteScoreArray = { voteScore: bigint; boostingHeight: number }[];

export type VoteScoreOrArray = bigint | VoteScoreArray;
