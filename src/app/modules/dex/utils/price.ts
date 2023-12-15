import Decimal from 'decimal.js';
import BigNumber from 'bignumber.js';
import { BigIntAble, Uint, Uint256String } from '../stores/library/int';
import { FixedPoint128, FullMath } from '../stores/library/core';

Decimal.set({ toExpPos: 9_999_999, toExpNeg: -9_999_999 });
BigNumber.config({ EXPONENTIAL_AT: 999999, DECIMAL_PLACES: 40 });

const TEN = Uint.from(10);
const FIVE_SIG_FIGS_POW = new Decimal(10).pow(5);

export function decodePriceSqrt(
	sqrtRatioX96: string,
	decimalsToken0 = 8,
	decimalsToken1 = 8,
	inverse = false,
): string {
	const ratioNum = ((parseInt(sqrtRatioX96.toString(), 10) / 2 ** 96) ** 2).toPrecision(5);
	let ratio = new Decimal(ratioNum.toString());

	if (decimalsToken1 < decimalsToken0) {
		ratio = ratio.mul(TEN.pow(decimalsToken0 - decimalsToken1).toString());
	} else if (decimalsToken0 < decimalsToken1) {
		ratio = ratio.div(TEN.pow(decimalsToken1 - decimalsToken0).toString());
	}

	if (inverse) {
		ratio = ratio.pow(-1);
	}

	if (ratio.lessThan(FIVE_SIG_FIGS_POW)) {
		return ratio.toPrecision(5);
	}

	return ratio.toString();
}

export function encodePriceSqrt(reserve1: BigIntAble, reserve0: BigIntAble): Uint {
	return Uint.from(
		new BigNumber(reserve1.toString())
			.div(reserve0.toString())
			.sqrt()
			.multipliedBy(new BigNumber(2).pow(96))
			.integerValue(3)
			.toString(),
	);
}

export function encodeFeeGrowth(feeGrowth: Uint256String, liquidity: Uint256String) {
	return FullMath.mulDiv(feeGrowth, FixedPoint128.Q128, liquidity);
}

export function decodeFeeGrowth(feeGrowthX128: Uint256String, liquidity: Uint256String) {
	return FullMath.mulDiv(feeGrowthX128, liquidity, FixedPoint128.Q128);
}
