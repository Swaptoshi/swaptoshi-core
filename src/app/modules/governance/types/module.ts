import { Modules } from 'klayr-sdk';

export type FeeMethod = Modules.Fee.FeeMethod;

export type TokenMethod = Modules.Token.TokenMethod;

export interface GovernanceModuleDependencies {
	tokenMethod: TokenMethod;
	feeMethod: FeeMethod;
}

export type VoteScoreArray = { voteScore: bigint; boostingHeight: number }[];

export type VoteScoreOrArray = bigint | VoteScoreArray;
