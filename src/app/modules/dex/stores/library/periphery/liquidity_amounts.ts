import { Uint256String, Uint128String, Uint128, Uint160String, Uint160, Uint256 } from '../int';

import * as FullMath from '../core/full_math';
import * as FixedPoint96 from '../core/fixed_point_96';

export function toUint128(x: Uint256String): Uint128String {
	return Uint128.from(x).toString();
}

export function getLiquidityForAmount0(
	sqrtRatioAX96: Uint160String,
	sqrtRatioBX96: Uint160String,
	amount0: Uint256String,
): Uint128String {
	let _sqrtRatioAX96 = sqrtRatioAX96;
	let _sqrtRatioBX96 = sqrtRatioBX96;
	if (Uint160.from(sqrtRatioAX96).gt(sqrtRatioBX96)) {
		_sqrtRatioAX96 = sqrtRatioBX96;
		_sqrtRatioBX96 = sqrtRatioAX96;
	}
	const intermediate: Uint256String = FullMath.mulDiv(
		_sqrtRatioAX96,
		_sqrtRatioBX96,
		FixedPoint96.Q96,
	);
	const liquidity = toUint128(
		FullMath.mulDiv(
			amount0,
			intermediate,
			Uint160.from(_sqrtRatioBX96).sub(_sqrtRatioAX96).toString(),
		),
	);
	return liquidity;
}

export function getLiquidityForAmount1(
	sqrtRatioAX96: Uint160String,
	sqrtRatioBX96: Uint160String,
	amount1: Uint256String,
): Uint128String {
	let _sqrtRatioAX96 = sqrtRatioAX96;
	let _sqrtRatioBX96 = sqrtRatioBX96;
	if (Uint160.from(sqrtRatioAX96).gt(sqrtRatioBX96)) {
		_sqrtRatioAX96 = sqrtRatioBX96;
		_sqrtRatioBX96 = sqrtRatioAX96;
	}
	const liquidity = toUint128(
		FullMath.mulDiv(
			amount1,
			FixedPoint96.Q96,
			Uint160.from(_sqrtRatioBX96).sub(_sqrtRatioAX96).toString(),
		),
	);
	return liquidity;
}

export function getLiquidityForAmounts(
	sqrtRatioX96: Uint160String,
	sqrtRatioAX96: Uint160String,
	sqrtRatioBX96: Uint160String,
	amount0: Uint256String,
	amount1: Uint256String,
): Uint128String {
	let liquidity: Uint128String;
	let _sqrtRatioAX96 = sqrtRatioAX96;
	let _sqrtRatioBX96 = sqrtRatioBX96;
	if (Uint160.from(sqrtRatioAX96).gt(sqrtRatioBX96)) {
		_sqrtRatioAX96 = sqrtRatioBX96;
		_sqrtRatioBX96 = sqrtRatioAX96;
	}
	if (Uint160.from(sqrtRatioX96).lte(_sqrtRatioAX96)) {
		liquidity = getLiquidityForAmount0(_sqrtRatioAX96, _sqrtRatioBX96, amount0);
	} else if (Uint160.from(sqrtRatioX96).lt(_sqrtRatioBX96)) {
		const liquidity0 = getLiquidityForAmount0(sqrtRatioX96, _sqrtRatioBX96, amount0);
		const liquidity1 = getLiquidityForAmount1(_sqrtRatioAX96, sqrtRatioX96, amount1);

		liquidity = Uint128.from(liquidity0).lt(liquidity1) ? liquidity0 : liquidity1;
	} else {
		liquidity = getLiquidityForAmount1(_sqrtRatioAX96, _sqrtRatioBX96, amount1);
	}
	return liquidity;
}

export function getAmount0ForLiquidity(
	sqrtRatioAX96: Uint160String,
	sqrtRatioBX96: Uint160String,
	liquidity: Uint128String,
): Uint256String {
	let _sqrtRatioAX96 = sqrtRatioAX96;
	let _sqrtRatioBX96 = sqrtRatioBX96;
	if (Uint160.from(sqrtRatioAX96).gt(sqrtRatioBX96)) {
		_sqrtRatioAX96 = sqrtRatioBX96;
		_sqrtRatioBX96 = sqrtRatioAX96;
	}

	return Uint256.from(
		FullMath.mulDiv(
			Uint256.from(liquidity).shl(FixedPoint96.RESOLUTION).toString(),
			Uint160.from(_sqrtRatioBX96).sub(_sqrtRatioAX96).toString(),
			_sqrtRatioBX96,
		),
	)
		.div(_sqrtRatioAX96)
		.toString();
}

export function getAmount1ForLiquidity(
	sqrtRatioAX96: Uint160String,
	sqrtRatioBX96: Uint160String,
	liquidity: Uint128String,
): Uint256String {
	let _sqrtRatioAX96 = sqrtRatioAX96;
	let _sqrtRatioBX96 = sqrtRatioBX96;
	if (Uint160.from(sqrtRatioAX96).gt(sqrtRatioBX96)) {
		_sqrtRatioAX96 = sqrtRatioBX96;
		_sqrtRatioBX96 = sqrtRatioAX96;
	}

	return FullMath.mulDiv(
		liquidity,
		Uint160.from(_sqrtRatioBX96).sub(_sqrtRatioAX96).toString(),
		FixedPoint96.Q96,
	);
}

export function getAmountsForLiquidity(
	sqrtRatioX96: Uint160String,
	sqrtRatioAX96: Uint160String,
	sqrtRatioBX96: Uint160String,
	liquidity: Uint128String,
): [amount0: Uint256String, amount1: Uint256String] {
	let amount0: Uint256String = '0';
	let amount1: Uint256String = '0';

	let _sqrtRatioAX96 = sqrtRatioAX96;
	let _sqrtRatioBX96 = sqrtRatioBX96;
	if (Uint160.from(sqrtRatioAX96).gt(sqrtRatioBX96)) {
		_sqrtRatioAX96 = sqrtRatioBX96;
		_sqrtRatioBX96 = sqrtRatioAX96;
	}

	if (Uint160.from(sqrtRatioX96).lte(_sqrtRatioAX96)) {
		amount0 = getAmount0ForLiquidity(_sqrtRatioAX96, _sqrtRatioBX96, liquidity);
	} else if (Uint160.from(sqrtRatioX96).lt(_sqrtRatioBX96)) {
		amount0 = getAmount0ForLiquidity(sqrtRatioX96, _sqrtRatioBX96, liquidity);
		amount1 = getAmount1ForLiquidity(_sqrtRatioAX96, sqrtRatioX96, liquidity);
	} else {
		amount1 = getAmount1ForLiquidity(_sqrtRatioAX96, _sqrtRatioBX96, liquidity);
	}

	return [amount0, amount1];
}
