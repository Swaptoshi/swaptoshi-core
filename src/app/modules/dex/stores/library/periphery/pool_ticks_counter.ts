/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { TickBitmapStore } from '../../tick_bitmap';
import {
	Int24String,
	Uint32,
	Int16,
	Uint8,
	Int24,
	Uint256,
	Uint256String,
	Uint16String,
	Uint16,
} from '../int';
import { ImmutableContext, DEXPoolData } from '../../../types';

export async function countInitializedTicksCrossed(
	tickBitmapStore: TickBitmapStore,
	context: ImmutableContext,
	self: DEXPoolData & { address: Buffer },
	tickBefore: Int24String,
	tickAfter: Int24String,
): Promise<string> {
	let initializedTicksCrossed = Uint32.from(0);
	let wordPosLower = Int16.from(0);
	let wordPosHigher = Int16.from(0);
	let bitPosLower = Uint8.from(0);
	let bitPosHigher = Uint8.from(0);
	let tickBeforeInitialized = false;
	let tickAfterInitialized = false;

	const wordPos = Int16.from(0).add(Int24.from(tickBefore).div(self.tickSpacing).shr(8));
	const bitPos = Uint8.from(0).add(Int24.from(tickBefore).div(self.tickSpacing).mod(256));

	const wordPosAfter = Int16.from(0).add(Int24.from(tickAfter).div(self.tickSpacing).shr(8));
	const bitPosAfter = Uint8.from(Int24.from(tickAfter).div(self.tickSpacing).mod(256));

	tickAfterInitialized =
		Uint256.from(
			Uint256.from(
				(
					await tickBitmapStore.getOrDefault(
						context,
						tickBitmapStore.getKey(self.address, wordPosAfter.toString()),
					)
				).bitmap,
			).and(Uint256.from(1).shl(bitPosAfter)),
		).gt(0) &&
		Uint256.from(Int24.from(tickAfter).mod(self.tickSpacing)).eq(0) &&
		Int24.from(tickBefore).gt(tickAfter);

	tickBeforeInitialized =
		Uint256.from(
			Uint256.from(
				(
					await tickBitmapStore.getOrDefault(
						context,
						tickBitmapStore.getKey(self.address, wordPos.toString()),
					)
				).bitmap,
			).and(Uint256.from(1).shl(bitPos)),
		).gt(0) &&
		Uint256.from(Int24.from(tickBefore).mod(self.tickSpacing)).eq(0) &&
		Int24.from(tickBefore).lt(tickAfter);

	if (wordPos.lt(wordPosAfter) || (wordPos.eq(wordPosAfter) && bitPos.lte(bitPosAfter))) {
		wordPosLower = Int16.from(wordPos);
		bitPosLower = Uint8.from(bitPos);
		wordPosHigher = Int16.from(wordPosAfter);
		bitPosHigher = Uint8.from(bitPosAfter);
	} else {
		wordPosLower = Int16.from(wordPosAfter);
		bitPosLower = Uint8.from(bitPosAfter);
		wordPosHigher = Int16.from(wordPos);
		bitPosHigher = Uint8.from(bitPos);
	}

	let mask = Uint256.from(Uint256.MAX).shl(bitPosLower);
	while (wordPosLower.lte(wordPosHigher)) {
		if (wordPosLower.eq(wordPosHigher)) {
			mask = mask.and(Uint256.from(Uint256.MAX).shr(Uint8.from(255).sub(bitPosHigher)));
		}

		const masked = Uint256.from(
			(
				await tickBitmapStore.getOrDefault(
					context,
					tickBitmapStore.getKey(self.address, wordPosLower.toString()),
				)
			).bitmap,
		).and(mask);
		initializedTicksCrossed = initializedTicksCrossed.add(countOneBits(masked.toString()));
		wordPosLower = wordPosLower.add(1);
		mask = Uint256.from(Uint256.MAX);
	}

	if (tickAfterInitialized) {
		initializedTicksCrossed = initializedTicksCrossed.sub(1);
	}

	if (tickBeforeInitialized) {
		initializedTicksCrossed = initializedTicksCrossed.sub(1);
	}

	return initializedTicksCrossed.toString();
}

export function countOneBits(_x: Uint256String): Uint16String {
	let x = Uint256.from(_x);
	let bits = Uint16.from(0);
	while (!x.eq(0)) {
		bits = bits.add(1);
		x = x.and(x.sub(1));
	}
	return bits.toString();
}
