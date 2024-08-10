/* eslint-disable import/no-cycle */
/* eslint-disable no-constant-condition */
/* eslint-disable no-param-reassign */
import { ImmutableContext, MutableContext, Observation } from '../../../types';
import { ObservationStore, defaultObservation } from '../../observation';
import { Uint32String, Int24String, Uint128String, Uint32, Int56, Uint160, Uint128, Uint16String, Uint16, Uint256 } from '../int';

export function transform(last: Observation, blockTimestamp: Uint32String, tick: Int24String, liquidity: Uint128String): Observation {
	const delta: Uint32 = Uint32.from(blockTimestamp).sub(last.blockTimestamp);
	return {
		blockTimestamp,
		tickCumulative: Int56.from(last.tickCumulative).add(Int56.from(tick).mul(delta)).toString(),
		secondsPerLiquidityCumulativeX128: Uint160.from(last.secondsPerLiquidityCumulativeX128)
			.add(
				Uint160.from(delta)
					.shl(128)
					.div(Uint128.from(liquidity).gt(0) ? liquidity : 1),
			)
			.toString(),
		initialized: true,
	};
}

export async function initialize(
	observationStore: ObservationStore,
	context: MutableContext,
	poolAddress: Buffer,
	time: Uint32String,
	simulation = false,
): Promise<[cardinality: string, cardinalityNext: string]> {
	if (!simulation) {
		await observationStore.set(context, observationStore.getKey(poolAddress, '0'), {
			blockTimestamp: time,
			tickCumulative: '0',
			secondsPerLiquidityCumulativeX128: '0',
			initialized: true,
		});
	}

	const cardinality = '1';
	const cardinalityNext = '1';

	return [cardinality, cardinalityNext];
}

export async function write(
	observationStore: ObservationStore,
	context: MutableContext,
	poolAddress: Buffer,
	index: Uint16String,
	blockTimestamp: Uint32String,
	tick: Int24String,
	liquidity: Uint128String,
	cardinality: Uint16String,
	cardinalityNext: Uint16String,
	simulation = false,
): Promise<[indexUpdated: string, cardinalityUpdated: string]> {
	let indexUpdated = '';
	let cardinalityUpdated = '';

	const last = await observationStore.getOrDefault(context, observationStore.getKey(poolAddress, index));

	if (last.blockTimestamp === blockTimestamp) return [index, cardinality];

	if (Uint16.from(cardinalityNext).gt(cardinality) && Uint16.from(index).eq(Uint16.from(cardinality).sub(1))) {
		cardinalityUpdated = cardinalityNext;
	} else {
		cardinalityUpdated = cardinality;
	}

	indexUpdated = Uint16.from(index).add(1).mod(cardinalityUpdated).toString();

	if (!simulation) {
		await observationStore.set(context, observationStore.getKey(poolAddress, indexUpdated), transform(last, blockTimestamp, tick, liquidity));
	}

	return [indexUpdated, cardinalityUpdated];
}

export async function grow(observationStore: ObservationStore, context: MutableContext, poolAddress: Buffer, current: Uint16String, next: Uint16String, simulation = false): Promise<string> {
	if (Uint16.from(current).lte(0)) throw new Error('I');
	if (Uint16.from(next).lte(current)) return current;
	for (let i = Uint16.from(current); i.lt(next); i = i.add(1)) {
		if (!(await observationStore.has(context, observationStore.getKey(poolAddress, i.toString())))) {
			if (!simulation) {
				await observationStore.set(context, observationStore.getKey(poolAddress, i.toString()), {
					...defaultObservation,
					blockTimestamp: '1',
				});
			}
		} else {
			const observation = await observationStore.get(context, observationStore.getKey(poolAddress, i.toString()));
			if (!simulation) {
				await observationStore.set(context, observationStore.getKey(poolAddress, i.toString()), {
					...observation,
					blockTimestamp: '1',
				});
			}
		}
	}
	return next;
}

export function lte(time: Uint32String, a: Uint32String, b: Uint32String): boolean {
	if (Uint32.from(a).lte(time) && Uint32.from(b).lte(time)) return Uint32.from(a).lte(b);

	const aAdjusted: Uint256 = Uint256.from(Uint32.from(a).gt(time) ? a : Uint256.from(2).pow(32).add(a).toString());
	const bAdjusted: Uint256 = Uint256.from(Uint32.from(b).gt(time) ? b : Uint256.from(2).pow(32).add(b).toString());

	return aAdjusted.lte(bAdjusted);
}

export async function binarySearch(
	observationStore: ObservationStore,
	context: ImmutableContext,
	poolAddress: Buffer,
	time: Uint32String,
	target: Uint32String,
	index: Uint16String,
	cardinality: Uint16String,
): Promise<[beforeOrAt: Observation, atOrAfter: Observation]> {
	let beforeOrAt: Observation;
	let atOrAfter: Observation;

	let l: Uint256 = Uint256.from(index).add(1).mod(cardinality);
	let r: Uint256 = Uint256.from(l).add(cardinality).sub(1);
	let i: Uint256;

	while (true) {
		i = l.add(r).div(2);
		beforeOrAt = await observationStore.getOrDefault(context, observationStore.getKey(poolAddress, i.mod(cardinality).toString()));
		if (!beforeOrAt.initialized) {
			l = i.add(1);
			continue;
		}

		atOrAfter = await observationStore.getOrDefault(context, observationStore.getKey(poolAddress, i.add(1).mod(cardinality).toString()));

		const targetAtOrAfter = lte(time, beforeOrAt.blockTimestamp, target);
		if (targetAtOrAfter && lte(time, target, atOrAfter.blockTimestamp)) break;
		if (!targetAtOrAfter) r = i.sub(1);
		else l = i.add(1);
	}

	return [beforeOrAt, atOrAfter];
}

export async function getSurroundingObservations(
	observationStore: ObservationStore,
	context: ImmutableContext,
	poolAddress: Buffer,
	time: Uint32String,
	target: Uint32String,
	tick: Int24String,
	index: Uint16String,
	liquidity: Uint128String,
	cardinality: Uint16String,
): Promise<[beforeOrAt: Observation, atOrAfter: Observation]> {
	let beforeOrAt: Observation;
	let atOrAfter: Observation;

	beforeOrAt = await observationStore.getOrDefault(context, observationStore.getKey(poolAddress, index));

	if (lte(time, beforeOrAt.blockTimestamp, target)) {
		if (beforeOrAt.blockTimestamp === target) {
			// if newest observation equals target, we're in the same block, so we can ignore atOrAfter
			atOrAfter = beforeOrAt;
			return [beforeOrAt, atOrAfter];
		}
		return [beforeOrAt, transform(beforeOrAt, target, tick, liquidity)];
	}

	beforeOrAt = await observationStore.getOrDefault(context, observationStore.getKey(poolAddress, Uint16.from(index).add(1).mod(cardinality).toString()));
	if (!beforeOrAt.initialized) beforeOrAt = await observationStore.getOrDefault(context, observationStore.getKey(poolAddress, '0'));

	if (!lte(time, beforeOrAt.blockTimestamp, target)) throw new Error('OLD');

	return binarySearch(observationStore, context, poolAddress, time, target, index, cardinality);
}

export async function observeSingle(
	observationStore: ObservationStore,
	context: ImmutableContext,
	poolAddress: Buffer,
	time: Uint32String,
	secondsAgo: Uint32String,
	tick: Int24String,
	index: Uint16String,
	liquidity: Uint128String,
	cardinality: Uint16String,
): Promise<[tickCumulative: string, secondsPerLiquidityCumulativeX128: string]> {
	if (Uint32.from(secondsAgo).eq(0)) {
		let last = await observationStore.getOrDefault(context, observationStore.getKey(poolAddress, index));
		if (last.blockTimestamp !== time) last = transform(last, time, tick, liquidity);
		return [last.tickCumulative, last.secondsPerLiquidityCumulativeX128];
	}

	const target: Uint32 = Uint32.from(time).sub(secondsAgo);

	const [beforeOrAt, atOrAfter] = await getSurroundingObservations(observationStore, context, poolAddress, time, target.toString(), tick, index, liquidity, cardinality);

	if (target.eq(beforeOrAt.blockTimestamp)) {
		return [beforeOrAt.tickCumulative, beforeOrAt.secondsPerLiquidityCumulativeX128];
	}
	if (target.eq(atOrAfter.blockTimestamp)) {
		return [atOrAfter.tickCumulative, atOrAfter.secondsPerLiquidityCumulativeX128];
	}
	const observationTimeDelta: Uint32 = Uint32.from(atOrAfter.blockTimestamp).sub(beforeOrAt.blockTimestamp);
	const targetDelta: Uint32 = target.sub(beforeOrAt.blockTimestamp);

	const tickCumulative = Int56.from(atOrAfter.tickCumulative).sub(beforeOrAt.tickCumulative).div(observationTimeDelta).mul(targetDelta).add(beforeOrAt.tickCumulative);
	const secondsPerLiquidityCumulativeX128 = Uint160.from(0)
		.add(Uint256.from(atOrAfter.secondsPerLiquidityCumulativeX128).sub(beforeOrAt.secondsPerLiquidityCumulativeX128).toString())
		.mul(targetDelta)
		.div(observationTimeDelta)
		.add(beforeOrAt.secondsPerLiquidityCumulativeX128);
	return [tickCumulative.toString(), secondsPerLiquidityCumulativeX128.toString()];
}

export async function observe(
	observationStore: ObservationStore,
	context: ImmutableContext,
	poolAddress: Buffer,
	time: Uint32String,
	secondsAgo: Uint32String[],
	tick: Int24String,
	index: Uint16String,
	liquidity: Uint128String,
	cardinality: Uint16String,
): Promise<{ tickCumulatives: string[]; secondsPerLiquidityCumulativeX128s: string[] }> {
	if (Uint16.from(cardinality).lte(0)) throw new Error('I');

	const tickCumulatives: string[] = [];
	const secondsPerLiquidityCumulativeX128s: string[] = [];

	for (let i = Uint256.from(0); i.lt(secondsAgo.length); i = i.add(1)) {
		const [tickCumulative, secondsPerLiquidityCumulativeX128] = await observeSingle(observationStore, context, poolAddress, time, secondsAgo[i.toNumber()], tick, index, liquidity, cardinality);
		tickCumulatives.push(tickCumulative);
		secondsPerLiquidityCumulativeX128s.push(secondsPerLiquidityCumulativeX128);
	}

	return { tickCumulatives, secondsPerLiquidityCumulativeX128s };
}
