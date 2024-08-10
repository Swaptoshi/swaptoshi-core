/* eslint-disable import/no-cycle */
import { Observation, Slot0 } from '../../../types';
import { Uint128String, Uint32String, Int56String, Uint160String, Int24String, Uint32, Int24, Uint128, Int56, Uint160, Uint192, Uint256String, Uint256, Uint16, Int256, Int256String } from '../int';

import * as TickMath from '../core/tick_math';
import * as FullMath from '../core/full_math';

type ObservablePool = { slot0: Slot0; observations: Observation[]; liquidity: Uint128String };

type Observable = {
	observe(secondsAgos: Uint32String[]): [tickCumulatives: Int56String[], secondsPerLiquidityCumulativeX128s: Uint160String[]];
};

interface WeightedTickData {
	tick: Int24String;
	weight: Uint128String;
}

export function consult(pool: Observable, secondsAgo: Uint32String): [arithmeticMeanTick: Int24String, harmonicMeanLiquidity: Uint128String] {
	if (Uint32.from(secondsAgo).eq(0)) throw new Error('BP');

	let arithmeticMeanTick: Int24;

	const secondsAgos: Uint32String[] = [];
	secondsAgos.push(secondsAgo);
	secondsAgos.push('0');

	const [tickCumulatives, secondsPerLiquidityCumulativeX128s] = pool.observe(secondsAgos);

	const tickCumulativesDelta = Int56.from(tickCumulatives[1]).sub(tickCumulatives[0]);
	const secondsPerLiquidityCumulativesDelta = Uint160.from(secondsPerLiquidityCumulativeX128s[1]).sub(secondsPerLiquidityCumulativeX128s[0]);

	arithmeticMeanTick = Int24.from(tickCumulativesDelta).div(secondsAgo);
	if (tickCumulativesDelta.lt(0) && !tickCumulativesDelta.mod(secondsAgo).eq(0)) arithmeticMeanTick = arithmeticMeanTick.sub(1);

	const secondsAgoX160 = Uint192.from(secondsAgo).mul(Uint160.MAX);
	const harmonicMeanLiquidity = Uint128.from(0).add(secondsAgoX160.div(Uint192.from(secondsPerLiquidityCumulativesDelta).shl(32)));

	return [arithmeticMeanTick.toString(), harmonicMeanLiquidity.toString()];
}

export function getQuoteAtTick(tick: Int24String, baseAmount: Uint128String, baseToken: Buffer, quoteToken: Buffer): Uint256String {
	let quoteAmount: Uint256String;
	const sqrtRatioX96 = Uint160.from(TickMath.getSqrtRatioAtTick(tick));

	if (sqrtRatioX96.lte(Uint128.MAX)) {
		const ratioX192 = Uint256.from(sqrtRatioX96).mul(sqrtRatioX96);
		quoteAmount =
			baseToken.compare(quoteToken) < 0
				? FullMath.mulDiv(ratioX192.toString(), baseAmount, Uint256.from(1).shl(192).toString())
				: FullMath.mulDiv(Uint256.from(1).shl(192).toString(), baseAmount, ratioX192.toString());
	} else {
		const ratioX128 = Uint256.from(FullMath.mulDiv(sqrtRatioX96.toString(), sqrtRatioX96.toString(), Uint256.from(1).shl(64).toString()));
		quoteAmount =
			baseToken.compare(quoteToken) < 0
				? FullMath.mulDiv(ratioX128.toString(), baseAmount, Uint256.from(1).shl(128).toString())
				: FullMath.mulDiv(Uint256.from(1).shl(128).toString(), baseAmount, ratioX128.toString());
	}

	return quoteAmount;
}

export function getOldestObservationSecondsAgo(pool: ObservablePool, _timestamp: string): Uint32String {
	const { observationIndex, observationCardinality } = pool.slot0;
	if (Uint16.from(observationCardinality).lte(0)) throw new Error('NI');

	let observationTimestamp = '0';
	const { blockTimestamp, initialized } = pool.observations[Uint16.from(observationIndex).add(1).mod(observationCardinality).toNumber()];
	observationTimestamp = blockTimestamp;

	if (!initialized) {
		const { blockTimestamp: timestamp } = pool.observations[0];
		observationTimestamp = timestamp;
	}

	const secondsAgo = Uint32.from(_timestamp).sub(observationTimestamp);
	return secondsAgo.toString();
}

export function getBlockStartingTickAndLiquidity(pool: ObservablePool, timestamp: string): [Int24String, Uint128String] {
	let tick: Int24String;
	const { tick: slot0tick, observationIndex, observationCardinality } = pool.slot0;
	tick = slot0tick;

	if (Uint16.from(observationCardinality).lte(1)) throw new Error('NEO');

	const { blockTimestamp: observationTimestamp, tickCumulative, secondsPerLiquidityCumulativeX128 } = pool.observations[Uint16.from(observationIndex).toNumber()];
	if (!Uint32.from(observationTimestamp).eq(timestamp)) {
		return [tick, pool.liquidity];
	}

	const prevIndex = Uint256.from(Uint256.from(observationIndex).add(observationCardinality).sub(1)).mod(observationCardinality);
	const {
		blockTimestamp: prevObservationTimestamp,
		tickCumulative: prevTickCumulative,
		secondsPerLiquidityCumulativeX128: prevSecondsPerLiquidityCumulativeX128,
		initialized: prevInitialized,
	} = pool.observations[prevIndex.toNumber()];

	if (!prevInitialized) throw new Error('ONI');

	const delta = Uint32.from(observationTimestamp).sub(prevObservationTimestamp);
	tick = Int24.from(tickCumulative).sub(prevTickCumulative).div(delta).toString();
	const liquidity = Uint128.from(0)
		.add(Uint192.from(delta).mul(Uint160.MAX).div(Uint192.from(secondsPerLiquidityCumulativeX128).sub(prevSecondsPerLiquidityCumulativeX128).shl(32)))
		.toString();
	return [tick, liquidity];
}

export function getWeightedArithmeticMeanTick(weightedTickData: WeightedTickData[]): Int24String {
	let weightedArithmeticMeanTick: Int24 = Int24.from(0);
	let numerator: Int256 = Int256.from(0);
	let denominator: Uint256 = Uint256.from(0);

	for (let i: Uint256 = Uint256.from(0); i.lt(weightedTickData.length); i = i.add(1)) {
		numerator = numerator.add(Int256.from(weightedTickData[i.toNumber()].tick).mul(weightedTickData[i.toNumber()].weight));
		denominator = denominator.add(weightedTickData[i.toNumber()].weight);
	}

	weightedArithmeticMeanTick = Int24.from(0).add(numerator.div(Int256.from(0).add(denominator)));
	if (numerator.lt(0) && !numerator.mod(Int256.from(0).add(denominator)).eq(0)) weightedArithmeticMeanTick = weightedArithmeticMeanTick.sub(1);
	return weightedArithmeticMeanTick.toString();
}

export function getChainedPrice(tokens: Buffer[], ticks: Int24String[]): Int256String {
	let syntheticTick: Int256 = Int256.from(0);
	if (tokens.length - 1 !== ticks.length) throw new Error('DL');
	for (let i: Uint256 = Uint256.from(1); i.lte(ticks.length); i = i.add(1)) {
		if (tokens[i.sub(1).toNumber()].compare(tokens[i.toNumber()]) < 0) {
			syntheticTick = syntheticTick.add(ticks[i.sub(1).toNumber()]);
		} else {
			syntheticTick = syntheticTick.sub(ticks[i.sub(1).toNumber()]);
		}
	}
	return syntheticTick.toString();
}
