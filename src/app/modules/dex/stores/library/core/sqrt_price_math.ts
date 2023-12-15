/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
	Uint160String,
	Uint128String,
	Uint256String,
	Uint256,
	Uint160,
	Uint128,
	Int256String,
	Int256,
} from '../int';

import * as FixedPoint96 from './fixed_point_96';
import * as FullMath from './full_math';
import * as UnsafeMath from './unsafe_math';

export function getNextSqrtPriceFromAmount0RoundingUp(
	sqrtPX96: Uint160String,
	liquidity: Uint128String,
	amount: Uint256String,
	add: boolean,
): Uint160String {
	if (Uint256.from(amount).eq(0)) return sqrtPX96;

	const numerator1: Uint256 = Uint256.from(liquidity).shl(parseInt(FixedPoint96.RESOLUTION, 10));

	if (add) {
		const product: Uint256 = Uint256.from(amount).mul(sqrtPX96);
		if (product.div(amount).eq(sqrtPX96)) {
			const denominator = numerator1.add(product);
			if (denominator.gte(numerator1))
				return FullMath.mulDivRoundingUp(numerator1.toString(), sqrtPX96, denominator.toString());
		}
		return Uint160.from(
			UnsafeMath.divRoundingUp(
				numerator1.toString(),
				numerator1.div(sqrtPX96).add(amount).toString(),
			),
		).toString();
	}

	const product: Uint256 = Uint256.from(amount).mul(sqrtPX96);
	if (product.div(amount).eq(sqrtPX96) && numerator1.gt(product)) {
		const denominator = numerator1.sub(product);
		return Uint160.from(
			FullMath.mulDivRoundingUp(numerator1.toString(), sqrtPX96, denominator.toString()),
		).toString();
	}

	throw new Error('denominator overflow');
}

export function getNextSqrtPriceFromAmount1RoundingDown(
	sqrtPX96: Uint160String,
	liquidity: Uint128String,
	amount: Uint256String,
	add: boolean,
): Uint160String {
	if (add) {
		const quotient: Uint256 = Uint256.from(amount).lte(Uint160.MAX)
			? Uint256.from(amount).shl(parseInt(FixedPoint96.RESOLUTION, 10)).div(liquidity)
			: Uint256.from(FullMath.mulDiv(amount, FixedPoint96.Q96, liquidity));
		return Uint160.from(Uint256.from(sqrtPX96).add(quotient).toString()).toString();
	}
	const quotient: Uint256 = Uint256.from(amount).lte(Uint160.MAX)
		? Uint256.from(
				UnsafeMath.divRoundingUp(
					Uint256.from(amount).shl(parseInt(FixedPoint96.RESOLUTION, 10)).toString(),
					liquidity,
				),
		  )
		: Uint256.from(FullMath.mulDivRoundingUp(amount, FixedPoint96.Q96, liquidity));
	if (Uint256.from(sqrtPX96).lte(quotient)) {
		throw new Error('sqrtPX96 is less than equal to quotient');
	}
	return Uint160.from(sqrtPX96).sub(quotient).toString();
}

export function getNextSqrtPriceFromInput(
	sqrtPX96: Uint160String,
	liquidity: Uint128String,
	amountIn: Uint256String,
	zeroForOne: boolean,
): Uint160String {
	if (Uint160.from(sqrtPX96).lte(0)) throw new Error('sqrtPX96 must be positive');
	if (Uint128.from(liquidity).lte(0)) throw new Error('liquidity must be positive');

	return zeroForOne
		? getNextSqrtPriceFromAmount0RoundingUp(sqrtPX96, liquidity, amountIn, true)
		: getNextSqrtPriceFromAmount1RoundingDown(sqrtPX96, liquidity, amountIn, true);
}

export function getNextSqrtPriceFromOutput(
	sqrtPX96: Uint160String,
	liquidity: Uint128String,
	amountOut: Uint256String,
	zeroForOne: boolean,
): Uint160String {
	if (Uint160.from(sqrtPX96).lte(0)) throw new Error('sqrtPX96 must be positive');
	if (Uint128.from(liquidity).lte(0)) throw new Error('liquidity must be positive');

	return zeroForOne
		? getNextSqrtPriceFromAmount1RoundingDown(sqrtPX96, liquidity, amountOut, false)
		: getNextSqrtPriceFromAmount0RoundingUp(sqrtPX96, liquidity, amountOut, false);
}

export function getAmount0DeltaHelper(
	_sqrtRatioAX96: Uint160String,
	_sqrtRatioBX96: Uint160String,
	liquidity: Uint128String,
	roundUp: boolean,
): Uint256String {
	let sqrtRatioAX96 = _sqrtRatioAX96;
	let sqrtRatioBX96 = _sqrtRatioBX96;

	if (Uint160.from(sqrtRatioAX96).gt(sqrtRatioBX96))
		[sqrtRatioAX96, sqrtRatioBX96] = [sqrtRatioBX96, sqrtRatioAX96];

	const numerator1: string = Uint256.from(liquidity)
		.shl(parseInt(FixedPoint96.RESOLUTION, 10))
		.toString();
	const numerator2: string = Uint256.from(sqrtRatioBX96).sub(sqrtRatioAX96).toString();

	if (Uint256.from(sqrtRatioAX96).lte(0)) throw new Error('sqrtRatioAX96 must be positive');

	return roundUp
		? UnsafeMath.divRoundingUp(
				FullMath.mulDivRoundingUp(numerator1, numerator2, sqrtRatioBX96),
				sqrtRatioAX96,
		  )
		: Uint256.from(FullMath.mulDiv(numerator1, numerator2, sqrtRatioBX96))
				.div(sqrtRatioAX96)
				.toString();
}

export function getAmount1DeltaHelper(
	_sqrtRatioAX96: Uint160String,
	_sqrtRatioBX96: Uint160String,
	liquidity: Uint128String,
	roundUp: boolean,
): Uint256String {
	let sqrtRatioAX96 = _sqrtRatioAX96;
	let sqrtRatioBX96 = _sqrtRatioBX96;

	if (Uint160.from(sqrtRatioAX96).gt(sqrtRatioBX96))
		[sqrtRatioAX96, sqrtRatioBX96] = [sqrtRatioBX96, sqrtRatioAX96];

	return roundUp
		? FullMath.mulDivRoundingUp(
				liquidity,
				Uint160.from(sqrtRatioBX96).sub(sqrtRatioAX96).toString(),
				FixedPoint96.Q96,
		  )
		: FullMath.mulDiv(
				liquidity,
				Uint160.from(sqrtRatioBX96).sub(sqrtRatioAX96).toString(),
				FixedPoint96.Q96,
		  );
}

export function getAmount0Delta(
	sqrtRatioAX96: Uint160String,
	sqrtRatioBX96: Uint160String,
	liquidity: Uint128String,
): Int256String {
	return Int256.from(liquidity).lt(0)
		? Int256.from(
				`-${getAmount0DeltaHelper(
					sqrtRatioAX96,
					sqrtRatioBX96,
					Int256.from(liquidity).mul(-1).toString(),
					false,
				)}`,
		  ).toString()
		: Int256.from(getAmount0DeltaHelper(sqrtRatioAX96, sqrtRatioBX96, liquidity, true)).toString();
}

export function getAmount1Delta(
	sqrtRatioAX96: Uint160String,
	sqrtRatioBX96: Uint160String,
	liquidity: Uint128String,
): Int256String {
	return Int256.from(liquidity).lt(0)
		? Int256.from(
				`-${getAmount1DeltaHelper(
					sqrtRatioAX96,
					sqrtRatioBX96,
					Int256.from(liquidity).mul(-1).toString(),
					false,
				)}`,
		  ).toString()
		: Int256.from(getAmount1DeltaHelper(sqrtRatioAX96, sqrtRatioBX96, liquidity, true)).toString();
}
