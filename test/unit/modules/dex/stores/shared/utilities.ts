/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable no-param-reassign */
import * as _ from 'lodash';
import { TestCallee } from './fixtures/TestCallee';

import { BigIntAble, Uint } from '../../../../../../src/app/modules/dex/stores/library/int';
import { DEXPool } from '../../../../../../src/app/modules/dex/stores/factory';
import { TestRouter } from './fixtures/TestRouter';
import { encodePriceSqrt as encodePriceSqrtFun } from '../../../../../../src/app/modules/dex/utils';

export const MaxUint128 = Uint.from(2).pow(128).sub(1);

export const getMinTick = (tickSpacing: string) =>
	Math.ceil(-887272 / parseInt(tickSpacing, 10)) * parseInt(tickSpacing, 10);
export const getMaxTick = (tickSpacing: string) =>
	Math.floor(887272 / parseInt(tickSpacing, 10)) * parseInt(tickSpacing, 10);
export const getMaxLiquidityPerTick = (tickSpacing: string) =>
	Uint.from(2)
		.pow(128)
		.sub(1)
		.div((getMaxTick(tickSpacing) - getMinTick(tickSpacing)) / parseInt(tickSpacing, 10) + 1)
		.toString();

export const MIN_SQRT_RATIO = Uint.from('4295128739');
export const MAX_SQRT_RATIO = Uint.from('1461446703485210103287273052203988822378723970342');

export const FeeAmount = {
	LOW: '500',
	MEDIUM: '3000',
	HIGH: '10000',
};

export const TICK_SPACINGS: { [amount in string]: string } = {
	[FeeAmount.LOW]: '10',
	[FeeAmount.MEDIUM]: '60',
	[FeeAmount.HIGH]: '200',
};

export function expandTo18Decimals(n: number): Uint {
	return Uint.from(n).mul(Uint.from(10).pow(18));
}

// returns the sqrt price as a 64x96
export const encodePriceSqrt = encodePriceSqrtFun;
// export function encodePriceSqrt(reserve1: BigIntAble, reserve0: BigIntAble): Uint {
// 	return Uint.from(
// 		new BigNumber(reserve1.toString())
// 			.div(reserve0.toString())
// 			.sqrt()
// 			.multipliedBy(new BigNumber(2).pow(96))
// 			.integerValue(3)
// 			.toString(),
// 	);
// }

export type SwapFunction = (
	amount: BigIntAble,
	to: Buffer,
	sqrtPriceLimitX96?: BigIntAble,
) => Promise<void>;

export type SwapToPriceFunction = (sqrtPriceX96: BigIntAble, to: Buffer) => Promise<void>;

export type FlashFunction = (
	amount0: BigIntAble,
	amount1: BigIntAble,
	to: Buffer,
	pay0?: BigIntAble,
	pay1?: BigIntAble,
) => Promise<void>;

export type MintFunction = (
	recipient: string,
	tickLower: BigIntAble,
	tickUpper: BigIntAble,
	liquidity: BigIntAble,
) => Promise<[string, string]>;

export interface PoolFunctions {
	swapToLowerPrice: SwapToPriceFunction;
	swapToHigherPrice: SwapToPriceFunction;
	swapExact0For1: SwapFunction;
	swap0ForExact1: SwapFunction;
	swapExact1For0: SwapFunction;
	swap1ForExact0: SwapFunction;
	flash: FlashFunction;
	mint: MintFunction;
}
export function createPoolFunctions({
	swapTarget,
	token0,
	token1,
	pool,
}: {
	swapTarget: TestCallee;
	token0: Buffer;
	token1: Buffer;
	pool: DEXPool;
}): PoolFunctions {
	async function swapToSqrtPrice(
		inputToken: Buffer,
		targetPrice: BigIntAble,
		to: Buffer,
	): Promise<void> {
		const method =
			inputToken.compare(token0) === 0
				? swapTarget.swapToLowerSqrtPrice.bind(swapTarget)
				: swapTarget.swapToHigherSqrtPrice.bind(swapTarget);
		return method(pool, targetPrice.toString(), to);
	}

	async function swap(
		inputToken: Buffer,
		[amountIn, amountOut]: [string, string],
		to: Buffer,
		sqrtPriceLimitX96?: BigIntAble,
	): Promise<void> {
		const exactInput = amountOut === '0';

		const method =
			// eslint-disable-next-line no-nested-ternary
			inputToken.compare(token0) === 0
				? exactInput
					? swapTarget.swapExact0For1.bind(swapTarget)
					: swapTarget.swap0ForExact1.bind(swapTarget)
				: exactInput
				? swapTarget.swapExact1For0.bind(swapTarget)
				: swapTarget.swap1ForExact0.bind(swapTarget);

		if (typeof sqrtPriceLimitX96 === 'undefined') {
			if (inputToken === token0) {
				sqrtPriceLimitX96 = MIN_SQRT_RATIO.add(1);
			} else {
				sqrtPriceLimitX96 = MAX_SQRT_RATIO.sub(1);
			}
		}

		return method(pool, exactInput ? amountIn : amountOut, to, sqrtPriceLimitX96.toString());
	}

	const swapToLowerPrice: SwapToPriceFunction = async (sqrtPriceX96, to) => {
		return swapToSqrtPrice(token0, sqrtPriceX96, to);
	};

	const swapToHigherPrice: SwapToPriceFunction = async (sqrtPriceX96, to) => {
		return swapToSqrtPrice(token1, sqrtPriceX96, to);
	};

	const swapExact0For1: SwapFunction = async (amount, to, sqrtPriceLimitX96) => {
		return swap(token0, [amount.toString(), '0'], to, sqrtPriceLimitX96);
	};

	const swap0ForExact1: SwapFunction = async (amount, to, sqrtPriceLimitX96) => {
		return swap(token0, ['0', amount.toString()], to, sqrtPriceLimitX96);
	};

	const swapExact1For0: SwapFunction = async (amount, to, sqrtPriceLimitX96) => {
		return swap(token1, [amount.toString(), '0'], to, sqrtPriceLimitX96);
	};

	const swap1ForExact0: SwapFunction = async (amount, to, sqrtPriceLimitX96) => {
		return swap(token1, ['0', amount.toString()], to, sqrtPriceLimitX96);
	};

	const mint: MintFunction = async (recipient, tickLower, tickUpper, liquidity) => {
		return swapTarget.mint.bind(swapTarget)(
			pool,
			Buffer.from(recipient, 'hex'),
			tickLower.toString(),
			tickUpper.toString(),
			liquidity.toString(),
		);
	};

	const flash: FlashFunction = async (
		amount0,
		amount1,
		to,
		pay0?: BigIntAble,
		pay1?: BigIntAble,
	) => {
		const { fee } = pool;
		if (typeof pay0 === 'undefined') {
			pay0 = Uint.from(amount0)
				.mul(fee)
				.add(1e6 - 1)
				.div(1e6)
				.add(amount0);
		}
		if (typeof pay1 === 'undefined') {
			pay1 = Uint.from(amount1)
				.mul(fee)
				.add(1e6 - 1)
				.div(1e6)
				.add(amount1);
		}
		return swapTarget.flash.bind(swapTarget)(
			pool,
			to,
			amount0.toString(),
			amount1.toString(),
			pay0.toString(),
			pay1.toString(),
		);
	};

	return {
		swapToLowerPrice,
		swapToHigherPrice,
		swapExact0For1,
		swap0ForExact1,
		swapExact1For0,
		swap1ForExact0,
		mint,
		flash,
	};
}

export interface MultiPoolFunctions {
	swapForExact0Multi: SwapFunction;
	swapForExact1Multi: SwapFunction;
}

export function createMultiPoolFunctions({
	swapTarget,
	poolInput,
	poolOutput,
}: {
	inputToken: Buffer;
	swapTarget: TestRouter;
	poolInput: DEXPool;
	poolOutput: DEXPool;
}): MultiPoolFunctions {
	// eslint-disable-next-line @typescript-eslint/require-await
	async function swapForExact0Multi(amountOut: BigIntAble, to: Buffer): Promise<void> {
		const method = swapTarget.swapForExact0Multi.bind(swapTarget);
		return method(to, poolInput, poolOutput, amountOut.toString());
	}

	// eslint-disable-next-line @typescript-eslint/require-await
	async function swapForExact1Multi(amountOut: BigIntAble, to: Buffer): Promise<void> {
		const method = swapTarget.swapForExact1Multi.bind(swapTarget);
		return method(to, poolInput, poolOutput, amountOut.toString());
	}

	return {
		swapForExact0Multi,
		swapForExact1Multi,
	};
}
