/* eslint-disable @typescript-eslint/require-await */
import * as liquidityFromAmounts from '../../../../../../../src/app/modules/dex/stores/library/periphery/liquidity_amounts';
import { encodePriceSqrt } from '../../shared/utilities';

describe('LiquidityAmounts', () => {
	describe('#getLiquidityForAmounts', () => {
		it('amounts for price inside', async () => {
			const sqrtPriceX96 = encodePriceSqrt(1, 1).toString();
			const sqrtPriceAX96 = encodePriceSqrt(100, 110).toString();
			const sqrtPriceBX96 = encodePriceSqrt(110, 100).toString();
			const liquidity = liquidityFromAmounts.getLiquidityForAmounts(sqrtPriceX96, sqrtPriceAX96, sqrtPriceBX96, '100', '200');
			expect(liquidity).toBe('2148');
		});

		it('amounts for price below', async () => {
			const sqrtPriceX96 = encodePriceSqrt(99, 110).toString();
			const sqrtPriceAX96 = encodePriceSqrt(100, 110).toString();
			const sqrtPriceBX96 = encodePriceSqrt(110, 100).toString();
			const liquidity = liquidityFromAmounts.getLiquidityForAmounts(sqrtPriceX96, sqrtPriceAX96, sqrtPriceBX96, '100', '200');
			expect(liquidity).toBe('1048');
		});

		it('amounts for price above', async () => {
			const sqrtPriceX96 = encodePriceSqrt(111, 100).toString();
			const sqrtPriceAX96 = encodePriceSqrt(100, 110).toString();
			const sqrtPriceBX96 = encodePriceSqrt(110, 100).toString();
			const liquidity = liquidityFromAmounts.getLiquidityForAmounts(sqrtPriceX96, sqrtPriceAX96, sqrtPriceBX96, '100', '200');
			expect(liquidity).toBe('2097');
		});

		it('amounts for price equal to lower boundary', async () => {
			const sqrtPriceAX96 = encodePriceSqrt(100, 110).toString();
			const sqrtPriceX96 = sqrtPriceAX96;
			const sqrtPriceBX96 = encodePriceSqrt(110, 100).toString();
			const liquidity = liquidityFromAmounts.getLiquidityForAmounts(sqrtPriceX96, sqrtPriceAX96, sqrtPriceBX96, '100', '200');
			expect(liquidity).toBe('1048');
		});

		it('amounts for price equal to upper boundary', async () => {
			const sqrtPriceAX96 = encodePriceSqrt(100, 110).toString();
			const sqrtPriceBX96 = encodePriceSqrt(110, 100).toString();
			const sqrtPriceX96 = sqrtPriceBX96;
			const liquidity = liquidityFromAmounts.getLiquidityForAmounts(sqrtPriceX96, sqrtPriceAX96, sqrtPriceBX96, '100', '200');
			expect(liquidity).toBe('2097');
		});
	});

	describe('#getAmountsForLiquidity', () => {
		it('amounts for price inside', async () => {
			const sqrtPriceX96 = encodePriceSqrt(1, 1).toString();
			const sqrtPriceAX96 = encodePriceSqrt(100, 110).toString();
			const sqrtPriceBX96 = encodePriceSqrt(110, 100).toString();
			const [amount0, amount1] = liquidityFromAmounts.getAmountsForLiquidity(sqrtPriceX96, sqrtPriceAX96, sqrtPriceBX96, '2148');
			expect(amount0).toBe('99');
			expect(amount1).toBe('99');
		});

		it('amounts for price below', async () => {
			const sqrtPriceX96 = encodePriceSqrt(99, 110).toString();
			const sqrtPriceAX96 = encodePriceSqrt(100, 110).toString();
			const sqrtPriceBX96 = encodePriceSqrt(110, 100).toString();
			const [amount0, amount1] = liquidityFromAmounts.getAmountsForLiquidity(sqrtPriceX96, sqrtPriceAX96, sqrtPriceBX96, '1048');
			expect(amount0).toBe('99');
			expect(amount1).toBe('0');
		});

		it('amounts for price above', async () => {
			const sqrtPriceX96 = encodePriceSqrt(111, 100).toString();
			const sqrtPriceAX96 = encodePriceSqrt(100, 110).toString();
			const sqrtPriceBX96 = encodePriceSqrt(110, 100).toString();
			const [amount0, amount1] = liquidityFromAmounts.getAmountsForLiquidity(sqrtPriceX96, sqrtPriceAX96, sqrtPriceBX96, '2097');
			expect(amount0).toBe('0');
			expect(amount1).toBe('199');
		});

		it('amounts for price on lower boundary', async () => {
			const sqrtPriceAX96 = encodePriceSqrt(100, 110).toString();
			const sqrtPriceX96 = sqrtPriceAX96;
			const sqrtPriceBX96 = encodePriceSqrt(110, 100).toString();
			const [amount0, amount1] = liquidityFromAmounts.getAmountsForLiquidity(sqrtPriceX96, sqrtPriceAX96, sqrtPriceBX96, '1048');
			expect(amount0).toBe('99');
			expect(amount1).toBe('0');
		});

		it('amounts for price on upper boundary', async () => {
			const sqrtPriceAX96 = encodePriceSqrt(100, 110).toString();
			const sqrtPriceBX96 = encodePriceSqrt(110, 100).toString();
			const sqrtPriceX96 = sqrtPriceBX96;
			const [amount0, amount1] = liquidityFromAmounts.getAmountsForLiquidity(sqrtPriceX96, sqrtPriceAX96, sqrtPriceBX96, '2097');
			expect(amount0).toBe('0');
			expect(amount1).toBe('199');
		});
	});
});
