/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable no-useless-return */
import Decimal from 'decimal.js';
import * as fullMath from '../../../../../../../src/app/modules/dex/stores/library/core/full_math';
import { Uint, Uint256 } from '../../../../../../../src/app/modules/dex/stores/library/int';

Decimal.config({ toExpNeg: -500, toExpPos: 500 });
const Q128 = Uint.from(2).pow(128);

describe('FullMath', () => {
	describe('#mulDiv', () => {
		it('reverts if denominator is 0', async () => {
			const func = async () => {
				fullMath.mulDiv(Q128.toString(), '5', '0');
			};
			await expect(func()).rejects.toThrow();
		});
		it('reverts if denominator is 0 and numerator overflows', async () => {
			const func = async () => {
				fullMath.mulDiv(Q128.toString(), Q128.toString(), '0');
			};
			await expect(func()).rejects.toThrow();
		});
		it('reverts if output overflows uint256', async () => {
			const func = async () => {
				fullMath.mulDiv(Q128.toString(), Q128.toString(), '1');
			};
			await expect(func()).rejects.toThrow();
		});
		it('reverts on overflow with all max inputs', async () => {
			const func = async () => {
				fullMath.mulDiv(Uint256.MAX, Uint256.MAX, Uint256.from(Uint256.MAX).sub(1).toString());
			};
			await expect(func()).rejects.toThrow();
		});

		it('all max inputs', () => {
			expect(fullMath.mulDiv(Uint256.MAX, Uint256.MAX, Uint256.MAX)).toBe(Uint256.MAX);
		});

		it('accurate without phantom overflow', () => {
			const result = Uint.from(Q128).div(3).toString();
			expect(fullMath.mulDiv(Q128.toString(), Uint.from(50).mul(Q128).div(100).toString(), Uint.from(150).mul(Q128).div(100).toString()).toString()).toBe(result);
		});

		it('accurate with phantom overflow', () => {
			const result = Uint.from(4375).mul(Q128).div(1000).toString();
			expect(fullMath.mulDiv(Q128.toString(), Uint.from(35).mul(Q128).toString(), Uint.from(8).mul(Q128).toString()).toString()).toBe(result);
		});

		it('accurate with phantom overflow and repeating decimal', () => {
			const result = Uint.from(1).mul(Q128).div(3).toString();
			expect(fullMath.mulDiv(Q128.toString(), Uint.from(1000).mul(Q128).toString(), Uint.from(3000).mul(Q128).toString()).toString()).toBe(result);
		});
	});

	describe('#mulDivRoundingUp', () => {
		it('reverts if denominator is 0', async () => {
			const func = async () => {
				fullMath.mulDivRoundingUp(Q128.toString(), '5', '0');
			};
			await expect(func()).rejects.toThrow();
		});
		it('reverts if denominator is 0 and numerator overflows', async () => {
			const func = async () => {
				fullMath.mulDivRoundingUp(Q128.toString(), Q128.toString(), '0');
			};
			await expect(func()).rejects.toThrow();
		});
		it('reverts if output overflows uint256', async () => {
			const func = async () => {
				fullMath.mulDivRoundingUp(Q128.toString(), Q128.toString(), '1');
			};
			await expect(func()).rejects.toThrow();
		});
		it('reverts on overflow with all max inputs', async () => {
			const func = async () => {
				fullMath.mulDivRoundingUp(Uint256.MAX, Uint256.MAX, Uint256.from(Uint256.MAX).sub(1).toString());
			};
			await expect(func()).rejects.toThrow();
		});

		it('reverts if mulDiv overflows 256 bits after rounding up', async () => {
			const func = async () => {
				fullMath.mulDivRoundingUp('535006138814359', '432862656469423142931042426214547535783388063929571229938474969', '2');
			};
			await expect(func()).rejects.toThrow();
		});

		it('reverts if mulDiv overflows 256 bits after rounding up case 2', async () => {
			const func = async () => {
				fullMath.mulDivRoundingUp(
					'115792089237316195423570985008687907853269984659341747863450311749907997002549',
					'115792089237316195423570985008687907853269984659341747863450311749907997002550',
					'115792089237316195423570985008687907853269984653042931687443039491902864365164',
				);
			};
			await expect(func()).rejects.toThrow();
		});

		it('all max inputs', () => {
			expect(fullMath.mulDivRoundingUp(Uint256.MAX, Uint256.MAX, Uint256.MAX)).toBe(Uint256.MAX);
		});

		it('accurate without phantom overflow', () => {
			const result = Uint.from(Q128).div(3).add(1).toString();
			expect(fullMath.mulDivRoundingUp(Q128.toString(), Uint.from(50).mul(Q128).div(100).toString(), Uint.from(150).mul(Q128).div(100).toString())).toBe(result);
		});

		it('accurate with phantom overflow', () => {
			const result = Uint.from(4375).mul(Q128).div(1000).toString();
			expect(fullMath.mulDivRoundingUp(Q128.toString(), Uint.from(35).mul(Q128).toString(), Uint.from(8).mul(Q128).toString())).toBe(result);
		});

		it('accurate with phantom overflow and repeating decimal', () => {
			const result = Uint.from(1).mul(Q128).div(3).add(1).toString();
			expect(fullMath.mulDivRoundingUp(Q128.toString(), Uint.from(1000).mul(Q128).toString(), Uint.from(3000).mul(Q128).toString())).toBe(result);
		});
	});

	describe('fuzzer', () => {
		function pseudoRandomBigNumber() {
			return Uint.from(new Decimal(Uint256.MAX).mul(Math.random().toString()).round().toString());
		}

		const tests = Array(1_000)
			.fill(null)
			.map(() => {
				return {
					x: pseudoRandomBigNumber(),
					y: pseudoRandomBigNumber(),
					d: pseudoRandomBigNumber(),
				};
			})
			.map(({ x, y, d }) => {
				return {
					input: {
						x,
						y,
						d,
					},
					floored: () => fullMath.mulDiv(x.toString(), y.toString(), d.toString()),
					ceiled: () => fullMath.mulDivRoundingUp(x.toString(), y.toString(), d.toString()),
				};
			});

		for (const {
			input: { x, y, d },
			floored,
			ceiled,
		} of tests) {
			describe(`input: (x: ${x.toString()}, y: ${y.toString()}, d: ${d.toString()})`, () => {
				if (d.eq(0)) {
					it('should throw if d is 0', async () => {
						const funcFloored = async () => floored();
						await expect(funcFloored()).rejects.toThrow();

						const funcCeiled = async () => ceiled();
						await expect(funcCeiled()).rejects.toThrow();
						return;
					});
				} else if (x.eq(0) || y.eq(0)) {
					it('should return 0 if x or y is 0', () => {
						expect(floored()).toBe(0);
						expect(ceiled()).toBe(0);
						return;
					});
				} else if (x.mul(y).div(d).gt(Uint256.MAX)) {
					it('should throw if x * y / d > uint256.max', async () => {
						const funcFloored = async () => floored();
						await expect(funcFloored()).rejects.toThrow();

						const funcCeiled = async () => ceiled();
						await expect(funcCeiled()).rejects.toThrow();

						return;
					});
				} else {
					it('should return expected value', () => {
						expect(floored()).toBe(x.mul(y).div(d).toString());
						expect(ceiled()).toBe(
							x
								.mul(y)
								.div(d)
								.add(x.mul(y).mod(d).gt(0) ? 1 : 0)
								.toString(),
						);
					});
				}
			});
		}
	});
});
