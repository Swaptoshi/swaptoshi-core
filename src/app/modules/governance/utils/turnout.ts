import BigNumber from 'bignumber.js';

export function isSatisfyTurnoutBias(forCount: bigint, againstCount: bigint, totalTokenVoted: bigint, totalTokenSupply: bigint) {
	return new BigNumber(forCount.toString()).div(new BigNumber(totalTokenSupply.toString()).sqrt()).gt(new BigNumber(againstCount.toString()).div(new BigNumber(totalTokenVoted.toString()).sqrt()));
}
