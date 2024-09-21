/* eslint-disable @typescript-eslint/require-await */
import * as sqrtPriceMath from '../../../../../../../src/app/modules/dex/stores/library/core/sqrt_price_math';
import { Uint, Uint128, Uint256 } from '../../../../../../../src/app/modules/dex/stores/library/int';
import { encodePriceSqrt } from '../../shared/utilities';

function expandTo18Decimals(n: number): Uint {
	return Uint.from(n).mul(Uint.from(10).pow(18));
}

describe('SqrtPriceMath', () => {
	describe('#getNextSqrtPriceFromInput', () => {
		it('fails if price is zero', async () => {
			const func = async () => {
				sqrtPriceMath.getNextSqrtPriceFromInput('0', '0', expandTo18Decimals(1).div(10).toString(), false);
			};
			await expect(func()).rejects.toThrow();
		});

		it('fails if liquidity is zero', async () => {
			const func = async () => {
				sqrtPriceMath.getNextSqrtPriceFromInput('1', '0', expandTo18Decimals(1).div(10).toString(), true);
			};
			await expect(func()).rejects.toThrow();
		});

		it('fails if input amount overflows the price', async () => {
			const func = async () => {
				const price = Uint.from(2).pow(160).sub(1).toString();
				const liquidity = '1024';
				const amountIn = '1024';
				sqrtPriceMath.getNextSqrtPriceFromInput(price, liquidity, amountIn, false);
			};
			await expect(func()).rejects.toThrow();
		});

		it('any input amount cannot underflow the price', () => {
			const price = '1';
			const liquidity = '1';
			const amountIn = Uint.from(2).pow(255).toString();
			expect(sqrtPriceMath.getNextSqrtPriceFromInput(price, liquidity, amountIn, true)).toBe('1');
		});

		it('returns input price if amount in is zero and zeroForOne = true', () => {
			const price = encodePriceSqrt(1, 1).toString();
			expect(sqrtPriceMath.getNextSqrtPriceFromInput(price, expandTo18Decimals(1).div(10).toString(), '0', true)).toBe(price);
		});

		it('returns input price if amount in is zero and zeroForOne = false', () => {
			const price = encodePriceSqrt(1, 1).toString();
			expect(sqrtPriceMath.getNextSqrtPriceFromInput(price, expandTo18Decimals(1).div(10).toString(), '0', false)).toBe(price);
		});

		it('returns the minimum price for max inputs', () => {
			const sqrtP = Uint.from(2).pow(160).sub(1).toString();
			const liquidity = Uint256.from(Uint128.MAX);
			const maxAmountNoOverflow = Uint256.from(Uint256.MAX).sub(liquidity.shl(96).div(sqrtP));
			expect(sqrtPriceMath.getNextSqrtPriceFromInput(sqrtP.toString(), liquidity.toString(), maxAmountNoOverflow.toString(), true)).toBe('1');
		});

		it('input amount of 0.1 token1', () => {
			const sqrtQ = sqrtPriceMath.getNextSqrtPriceFromInput(encodePriceSqrt(1, 1).toString(), expandTo18Decimals(1).toString(), expandTo18Decimals(1).div(10).toString(), false);
			expect(sqrtQ).toBe('87150978765690771352898345369');
		});

		it('input amount of 0.1 token0', () => {
			const sqrtQ = sqrtPriceMath.getNextSqrtPriceFromInput(encodePriceSqrt(1, 1).toString(), expandTo18Decimals(1).toString(), expandTo18Decimals(1).div(10).toString(), true);
			expect(sqrtQ).toBe('72025602285694852357767227579');
		});

		it('amountIn > type(uint96).max and zeroForOne = true', () => {
			expect(
				sqrtPriceMath.getNextSqrtPriceFromInput(encodePriceSqrt(1, 1).toString(), expandTo18Decimals(10).toString(), Uint.from(2).pow(100).toString(), true),
				// perfect answer:
				// https://www.wolframalpha.com/input/?i=624999999995069620+-+%28%281e19+*+1+%2F+%281e19+%2B+2%5E100+*+1%29%29+*+2%5E96%29
			).toBe('624999999995069620');
		});

		it('can return 1 with enough amountIn and zeroForOne = true', () => {
			expect(sqrtPriceMath.getNextSqrtPriceFromInput(encodePriceSqrt(1, 1).toString(), '1', Uint256.from(Uint256.MAX).div(2).toString(), true)).toBe('1');
		});
	});

	describe('#getNextSqrtPriceFromOutput', () => {
		it('fails if price is zero', async () => {
			const func = async () => {
				sqrtPriceMath.getNextSqrtPriceFromOutput('0', '0', expandTo18Decimals(1).div(10).toString(), false);
			};
			await expect(func()).rejects.toThrow();
		});

		it('fails if liquidity is zero', async () => {
			const func = async () => {
				sqrtPriceMath.getNextSqrtPriceFromOutput('1', '0', expandTo18Decimals(1).div(10).toString(), true);
			};
			await expect(func()).rejects.toThrow();
		});

		it('fails if output amount is exactly the virtual reserves of token0', async () => {
			const func = async () => {
				const price = '20282409603651670423947251286016';
				const liquidity = '1024';
				const amountOut = '4';
				sqrtPriceMath.getNextSqrtPriceFromOutput(price, liquidity, amountOut, false);
			};
			await expect(func()).rejects.toThrow();
		});

		it('fails if output amount is greater than virtual reserves of token0', async () => {
			const func = async () => {
				const price = '20282409603651670423947251286016';
				const liquidity = '1024';
				const amountOut = '5';
				sqrtPriceMath.getNextSqrtPriceFromOutput(price, liquidity, amountOut, false);
			};
			await expect(func()).rejects.toThrow();
		});

		it('fails if output amount is greater than virtual reserves of token1', async () => {
			const func = async () => {
				const price = '20282409603651670423947251286016';
				const liquidity = '1024';
				const amountOut = '262145';
				sqrtPriceMath.getNextSqrtPriceFromOutput(price, liquidity, amountOut, false);
			};
			await expect(func()).rejects.toThrow();
		});

		it('fails if output amount is exactly the virtual reserves of token1', async () => {
			const func = async () => {
				const price = '20282409603651670423947251286016';
				const liquidity = '1024';
				const amountOut = '262144';
				sqrtPriceMath.getNextSqrtPriceFromOutput(price, liquidity, amountOut, false);
			};
			await expect(func()).rejects.toThrow();
		});

		it('succeeds if output amount is just less than the virtual reserves of token1', () => {
			const price = '20282409603651670423947251286016';
			const liquidity = '1024';
			const amountOut = '262143';
			const sqrtQ = sqrtPriceMath.getNextSqrtPriceFromOutput(price, liquidity, amountOut, true);
			expect(sqrtQ).toBe('77371252455336267181195264');
		});

		it('puzzling echidna test', async () => {
			const func = async () => {
				const price = '20282409603651670423947251286016';
				const liquidity = '1024';
				const amountOut = '4';
				sqrtPriceMath.getNextSqrtPriceFromOutput(price, liquidity, amountOut, false);
			};
			await expect(func()).rejects.toThrow();
		});

		it('returns input price if amount in is zero and zeroForOne = true', () => {
			const price = encodePriceSqrt(1, 1).toString();
			expect(sqrtPriceMath.getNextSqrtPriceFromOutput(price, expandTo18Decimals(1).div(10).toString(), '0', true)).toBe(price);
		});

		it('returns input price if amount in is zero and zeroForOne = false', () => {
			const price = encodePriceSqrt(1, 1).toString();
			expect(sqrtPriceMath.getNextSqrtPriceFromOutput(price, expandTo18Decimals(1).div(10).toString(), '0', false)).toBe(price);
		});

		it('output amount of 0.1 token1 zeroforone false', () => {
			const sqrtQ = sqrtPriceMath.getNextSqrtPriceFromOutput(encodePriceSqrt(1, 1).toString(), expandTo18Decimals(1).toString(), expandTo18Decimals(1).div(10).toString(), false);
			expect(sqrtQ).toBe('88031291682515930659493278152');
		});

		it('output amount of 0.1 token1 zeroforone true', () => {
			const sqrtQ = sqrtPriceMath.getNextSqrtPriceFromOutput(encodePriceSqrt(1, 1).toString(), expandTo18Decimals(1).toString(), expandTo18Decimals(1).div(10).toString(), true);
			expect(sqrtQ).toBe('71305346262837903834189555302');
		});

		it('reverts if amountOut is impossible in zero for one direction', async () => {
			const func = async () => {
				sqrtPriceMath.getNextSqrtPriceFromOutput(encodePriceSqrt(1, 1).toString(), '1', Uint256.MAX, true);
			};
			await expect(func()).rejects.toThrow();
		});

		it('reverts if amountOut is impossible in one for zero direction', async () => {
			const func = async () => {
				sqrtPriceMath.getNextSqrtPriceFromOutput(encodePriceSqrt(1, 1).toString(), '1', Uint256.MAX, false);
			};
			await expect(func()).rejects.toThrow();
		});
	});

	describe('#getAmount0DeltaHelper', () => {
		it('returns 0 if liquidity is 0', () => {
			const amount0 = sqrtPriceMath.getAmount0DeltaHelper(encodePriceSqrt(1, 1).toString(), encodePriceSqrt(2, 1).toString(), '0', true);

			expect(amount0).toBe('0');
		});
		it('returns 0 if prices are equal', () => {
			const amount0 = sqrtPriceMath.getAmount0DeltaHelper(encodePriceSqrt(1, 1).toString(), encodePriceSqrt(1, 1).toString(), '0', true);

			expect(amount0).toBe('0');
		});

		it('returns 0.1 amount1 for price of 1 to 1.21', () => {
			const amount0 = sqrtPriceMath.getAmount0DeltaHelper(encodePriceSqrt(1, 1).toString(), encodePriceSqrt(121, 100).toString(), expandTo18Decimals(1).toString(), true);
			expect(amount0).toBe('90909090909090910');

			const amount0RoundedDown = sqrtPriceMath.getAmount0DeltaHelper(encodePriceSqrt(1, 1).toString(), encodePriceSqrt(121, 100).toString(), expandTo18Decimals(1).toString(), false);

			expect(amount0RoundedDown).toBe(Uint256.from(amount0).sub(1).toString());
		});

		it('works for prices that overflow', () => {
			const amount0Up = sqrtPriceMath.getAmount0DeltaHelper(
				encodePriceSqrt(Uint.from(2).pow(90), 1).toString(),
				encodePriceSqrt(Uint.from(2).pow(96), 1).toString(),
				expandTo18Decimals(1).toString(),
				true,
			);
			const amount0Down = sqrtPriceMath.getAmount0DeltaHelper(
				encodePriceSqrt(Uint.from(2).pow(90), 1).toString(),
				encodePriceSqrt(Uint.from(2).pow(96), 1).toString(),
				expandTo18Decimals(1).toString(),
				false,
			);
			expect(amount0Up).toBe(Uint256.from(amount0Down).add(1).toString());
		});
	});

	describe('#getAmount1DeltaHelper', () => {
		it('returns 0 if liquidity is 0', () => {
			const amount1 = sqrtPriceMath.getAmount1DeltaHelper(encodePriceSqrt(1, 1).toString(), encodePriceSqrt(2, 1).toString(), '0', true);

			expect(amount1).toBe('0');
		});
		it('returns 0 if prices are equal', () => {
			const amount1 = sqrtPriceMath.getAmount0DeltaHelper(encodePriceSqrt(1, 1).toString(), encodePriceSqrt(1, 1).toString(), '0', true);

			expect(amount1).toBe('0');
		});

		it('returns 0.1 amount1 for price of 1 to 1.21', () => {
			const amount1 = sqrtPriceMath.getAmount1DeltaHelper(encodePriceSqrt(1, 1).toString(), encodePriceSqrt(121, 100).toString(), expandTo18Decimals(1).toString(), true);

			expect(amount1).toBe('100000000000000000');
			const amount1RoundedDown = sqrtPriceMath.getAmount1DeltaHelper(encodePriceSqrt(1, 1).toString(), encodePriceSqrt(121, 100).toString(), expandTo18Decimals(1).toString(), false);

			expect(amount1RoundedDown).toBe(Uint256.from(amount1).sub(1).toString());
		});
	});

	describe('swap computation', () => {
		it('sqrtP * sqrtQ overflows', () => {
			// getNextSqrtPriceInvariants(1025574284609383690408304870162715216695788925244,50015962439936049619261659728067971248,406,true)
			const sqrtP = '1025574284609383690408304870162715216695788925244';
			const liquidity = '50015962439936049619261659728067971248';
			const zeroForOne = true;
			const amountIn = '406';

			const sqrtQ = sqrtPriceMath.getNextSqrtPriceFromInput(sqrtP, liquidity, amountIn, zeroForOne);
			expect(sqrtQ).toBe('1025574284609383582644711336373707553698163132913');

			const amount0Delta = sqrtPriceMath.getAmount0DeltaHelper(sqrtQ, sqrtP, liquidity, true);
			expect(amount0Delta).toBe('406');
		});
	});
});
