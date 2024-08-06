import BigNumber from 'bignumber.js';

export function isSatisfyTurnoutBias(forCount: number, againstCount: number, totalTokenVoted: bigint, totalTokenSupply: bigint) {
	return new BigNumber(forCount).div(new BigNumber(totalTokenSupply.toString()).sqrt()).gt(new BigNumber(againstCount).div(new BigNumber(totalTokenVoted.toString()).sqrt()));
}
