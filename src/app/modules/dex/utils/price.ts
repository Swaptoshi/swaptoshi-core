/* eslint-disable import/no-cycle */
import Decimal from 'decimal.js';
import BigNumber from 'bignumber.js';
import { BigIntAble, Uint, Uint256String } from '../stores/library/int';
import { FixedPoint128, FullMath } from '../stores/library/core';

Decimal.set({ toExpPos: 9_999_999, toExpNeg: -9_999_999 });
BigNumber.config({ EXPONENTIAL_AT: 999999, DECIMAL_PLACES: 40 });

const TEN = Uint.from(10);
const FIVE_SIG_FIGS_POW = new Decimal(10).pow(5);

export function decodePriceSqrt(sqrtRatioX96: string, decimalsToken0 = 8, decimalsToken1 = 8, inverse = false, disableFiveSigPrecision = false) {
	const ratioNum = new Decimal(sqrtRatioX96)
		.div(2 ** 96)
		.pow(2)
		.toPrecision(5);
	let ratio = new Decimal(ratioNum);

	if (decimalsToken1 < decimalsToken0) {
		ratio = ratio.mul(TEN.pow(decimalsToken0 - decimalsToken1).toString());
	} else if (decimalsToken0 < decimalsToken1) {
		ratio = ratio.div(TEN.pow(decimalsToken1 - decimalsToken0).toString());
	}

	if (inverse) {
		ratio = ratio.pow(-1);
	}

	if (!disableFiveSigPrecision && ratio.lessThan(FIVE_SIG_FIGS_POW)) {
		return ratio.toPrecision(5);
	}

	return ratio.toString();
}

export function encodePriceSqrt(reserve1: BigIntAble, reserve0: BigIntAble): Uint {
	return Uint.from(new BigNumber(reserve1.toString()).div(reserve0.toString()).sqrt().multipliedBy(new BigNumber(2).pow(96)).integerValue(3).toString());
}

export function encodeFeeGrowth(feeGrowth: Uint256String, liquidity: Uint256String) {
	return FullMath.mulDiv(feeGrowth, FixedPoint128.Q128, liquidity);
}

export function decodeFeeGrowth(feeGrowthX128: Uint256String, liquidity: Uint256String) {
	return FullMath.mulDiv(feeGrowthX128, liquidity, FixedPoint128.Q128);
}

export function inversePriceSqrt(sqrtRatioX96: string, decimalsToken0 = 8, decimalsToken1 = 8) {
	const invertedPrice = decodePriceSqrt(sqrtRatioX96, decimalsToken0, decimalsToken1, true, true);
	return encodePriceSqrt(invertedPrice, 1).toString();
}
