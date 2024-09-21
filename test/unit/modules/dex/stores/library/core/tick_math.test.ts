/* eslint-disable @typescript-eslint/require-await */
import Decimal from 'decimal.js';

import * as tickMath from '../../../../../../../src/app/modules/dex/stores/library/core/tick_math';
import { Int256, Uint, Uint256 } from '../../../../../../../src/app/modules/dex/stores/library/int';
import { encodePriceSqrt } from '../../shared/utilities';

const MIN_TICK = -887272;
const MAX_TICK = 887272;

Decimal.config({ toExpNeg: -500, toExpPos: 500 });

describe('TickMath', () => {
	describe('#getSqrtRatioAtTick', () => {
		it('throws for too low - minTick', async () => {
			const func = async () => {
				tickMath.getSqrtRatioAtTick((MIN_TICK - 1).toString());
			};
			await expect(func()).rejects.toThrow('T');
		});

		it('throws for too low - maxTick', async () => {
			const func = async () => {
				tickMath.getSqrtRatioAtTick((MAX_TICK + 1).toString());
			};
			await expect(func()).rejects.toThrow('T');
		});

		it('min tick', () => {
			expect(tickMath.getSqrtRatioAtTick(MIN_TICK.toString())).toBe('4295128739');
		});

		it('min tick +1', () => {
			expect(tickMath.getSqrtRatioAtTick((MIN_TICK + 1).toString())).toBe('4295343490');
		});

		it('max tick - 1', () => {
			expect(tickMath.getSqrtRatioAtTick((MAX_TICK - 1).toString())).toBe('1461373636630004318706518188784493106690254656249');
		});

		it('min tick ratio is less than js implementation', () => {
			expect(Uint256.from(tickMath.getSqrtRatioAtTick(MIN_TICK.toString())).lt(encodePriceSqrt(1, Uint.from(2).pow(127)).toString())).toBe(true);
		});

		it('max tick ratio is greater than js implementation', () => {
			expect(Uint256.from(tickMath.getSqrtRatioAtTick(MAX_TICK.toString())).gt(encodePriceSqrt(Uint.from(2).pow(127), 1).toString())).toBe(true);
		});

		it('max tick', () => {
			expect(tickMath.getSqrtRatioAtTick(MAX_TICK.toString())).toBe('1461446703485210103287273052203988822378723970342');
		});

		for (const absTick of [50, 100, 250, 500, 1_000, 2_500, 3_000, 4_000, 5_000, 50_000, 150_000, 250_000, 500_000, 738_203]) {
			for (const tick of [-absTick, absTick]) {
				describe(`tick ${tick}`, () => {
					it('is at most off by 1/100th of a bips', () => {
						const jsResult = new Decimal(1.0001).pow(tick).sqrt().mul(new Decimal(2).pow(96));
						const result = tickMath.getSqrtRatioAtTick(tick.toString());
						const absDiff = new Decimal(result.toString()).sub(jsResult).abs();
						expect(absDiff.div(jsResult).toNumber()).toBeLessThan(0.000001);
					});
				});
			}
		}
	});

	describe('#MIN_SQRT_RATIO', () => {
		it('equals #getSqrtRatioAtTick(MIN_TICK)', () => {
			const min = tickMath.getSqrtRatioAtTick(MIN_TICK.toString());
			expect(min).toBe(tickMath.MIN_SQRT_RATIO);
		});
	});

	describe('#MAX_SQRT_RATIO', () => {
		it('equals #getSqrtRatioAtTick(MAX_TICK)', () => {
			const max = tickMath.getSqrtRatioAtTick(MAX_TICK.toString());
			expect(max).toBe(tickMath.MAX_SQRT_RATIO);
		});
	});

	describe('#getTickAtSqrtRatio', () => {
		it('throws for too low', async () => {
			const func = async () => {
				tickMath.getTickAtSqrtRatio(Uint256.from(tickMath.MIN_SQRT_RATIO).sub(1).toString());
			};
			await expect(func()).rejects.toThrow('R');
		});

		it('throws for too high', async () => {
			const func = async () => {
				tickMath.getTickAtSqrtRatio(Uint.from(tickMath.MAX_SQRT_RATIO).toString());
			};
			await expect(func()).rejects.toThrow('R');
		});

		it('ratio of min tick', () => {
			expect(tickMath.getTickAtSqrtRatio(tickMath.MIN_SQRT_RATIO)).toBe(MIN_TICK.toString());
		});
		it('ratio of min tick + 1', () => {
			expect(tickMath.getTickAtSqrtRatio('4295343490')).toBe((MIN_TICK + 1).toString());
		});
		it('ratio of max tick - 1', () => {
			expect(tickMath.getTickAtSqrtRatio('1461373636630004318706518188784493106690254656249')).toBe((MAX_TICK - 1).toString());
		});
		it('ratio closest to max tick', () => {
			expect(tickMath.getTickAtSqrtRatio(Uint256.from(tickMath.MAX_SQRT_RATIO).sub(1).toString())).toBe((MAX_TICK - 1).toString());
		});

		for (const ratio of [
			tickMath.MIN_SQRT_RATIO,
			encodePriceSqrt(Uint.from(10).pow(12), 1),
			encodePriceSqrt(Uint.from(10).pow(6), 1),
			encodePriceSqrt(1, 64),
			encodePriceSqrt(1, 8),
			encodePriceSqrt(1, 2),
			encodePriceSqrt(1, 1),
			encodePriceSqrt(2, 1),
			encodePriceSqrt(8, 1),
			encodePriceSqrt(64, 1),
			encodePriceSqrt(1, Uint.from(10).pow(6)),
			encodePriceSqrt(1, Uint.from(10).pow(12)),
			Uint256.from(tickMath.MAX_SQRT_RATIO).sub(1),
		]) {
			describe(`ratio ${ratio.toString()}`, () => {
				it('is at most off by 1', () => {
					const jsResult = new Decimal(ratio.toString()).div(new Decimal(2).pow(96)).pow(2).log(1.0001).floor();
					const result = tickMath.getTickAtSqrtRatio(ratio.toString());
					const absDiff = new Decimal(result.toString()).sub(jsResult).abs();
					expect(absDiff.toNumber()).toBeLessThanOrEqual(1);
				});
				it('ratio is between the tick and tick+1', () => {
					const tick = tickMath.getTickAtSqrtRatio(ratio.toString());
					const ratioOfTick = tickMath.getSqrtRatioAtTick(tick);
					const ratioOfTickPlusOne = tickMath.getSqrtRatioAtTick(Int256.from(tick).add(1).toString());
					expect(Uint256.from(ratio.toString()).gte(ratioOfTick)).toBe(true);
					expect(Uint256.from(ratio.toString()).lt(ratioOfTickPlusOne)).toBe(true);
				});
			});
		}
	});
});
