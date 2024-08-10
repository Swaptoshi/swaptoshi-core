/* eslint-disable import/no-cycle */
import { TickBitmapStore } from '../../tick_bitmap';
import { Int24String, Int16String, Uint8String, Int16, Int24, Uint8, Uint256 } from '../int';

import * as BitMath from './bit_math';
import { ImmutableContext, MutableContext } from '../../../types';

export function position(tick: Int24String): [wordPos: Int16String, bitPos: Uint8String] {
	const wordPos = Int16.from(Int24.from(tick).shr(8)).toString();
	const bitPos = Uint8.from(Int24.from(tick).mod(256)).toString();

	return [wordPos, bitPos];
}

export async function flipTick(tickBitmapStore: TickBitmapStore, context: MutableContext, poolAddress: Buffer, tick: Int24String, tickSpacing: Int24String, simulation = false) {
	if (!Int24.from(tick).mod(tickSpacing).eq(0)) throw new Error('invalid tickSpacing');
	const [wordPos, bitPos] = position(Int24.from(tick).div(tickSpacing).toString());
	const mask = Uint256.from(1).shl(bitPos);

	const tickData = await tickBitmapStore.getOrDefault(context, tickBitmapStore.getKey(poolAddress, wordPos));
	if (!simulation) {
		await tickBitmapStore.set(context, tickBitmapStore.getKey(poolAddress, wordPos), {
			bitmap: Uint256.from(tickData.bitmap).xor(mask).toString(),
		});
	}
}

export async function nextInitializedTickWithinOneWord(
	tickBitmapStore: TickBitmapStore,
	context: ImmutableContext,
	poolAddress: Buffer,
	tick: Int24String,
	tickSpacing: Int24String,
	lte: boolean,
): Promise<[next: string, initialized: boolean]> {
	let next: Int24;
	let initialized: boolean;

	let compressed: Int24 = Int24.from(tick).div(tickSpacing);
	if (Int24.from(tick).lt(0) && !Int24.from(tick).mod(tickSpacing).eq(0)) compressed = compressed.sub(1);

	if (lte) {
		const [wordPos, bitPos] = position(compressed.toString());
		const mask = Uint256.from(1).shl(bitPos).sub(1).add(Uint256.from(1).shl(bitPos));

		const tickData = await tickBitmapStore.getOrDefault(context, tickBitmapStore.getKey(poolAddress, wordPos));
		const masked = Uint256.from(tickData.bitmap).and(mask);

		initialized = !masked.eq(0);
		next = initialized
			? Int24.from(compressed)
					.sub(Int24.from(bitPos).sub(BitMath.mostSignificantBit(masked.toString())))
					.mul(tickSpacing)
			: Int24.from(compressed).sub(bitPos).mul(tickSpacing);
	} else {
		const [wordPos, bitPos] = position(compressed.add(1).toString());
		const mask = Uint256.from(1).shl(bitPos).sub(1).not();

		const tickData = await tickBitmapStore.getOrDefault(context, tickBitmapStore.getKey(poolAddress, wordPos));
		const masked = Uint256.from(tickData.bitmap).and(mask);

		initialized = !masked.eq(0);
		next = initialized
			? Int24.from(compressed)
					.add(1)
					.add(Int24.from(BitMath.leastSignificantBit(masked.toString())).sub(bitPos))
					.mul(tickSpacing)
			: Int24.from(compressed).add(1).add(Int24.from(Uint8.MAX).sub(bitPos)).mul(tickSpacing);
	}

	return [next.toString(), initialized];
}
