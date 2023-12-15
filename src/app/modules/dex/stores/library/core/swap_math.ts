import {
	Uint160String,
	Uint128String,
	Int256String,
	Uint24String,
	Uint256String,
	Uint160,
	Uint256,
	Int256,
	Uint24,
} from '../int';

import * as FullMath from './full_math';
import * as SqrtPriceMath from './sqrt_price_math';

export function computeSwapStep(
	sqrtRatioCurrentX96: Uint160String,
	sqrtRatioTargetX96: Uint160String,
	liquidity: Uint128String,
	amountRemaining: Int256String,
	feePips: Uint24String,
): [
	sqrtRatioNextX96: Uint160String,
	amountIn: Uint256String,
	amountOut: Uint256String,
	feeAmount: Uint256String,
] {
	let sqrtRatioNextX96: Uint160 = Uint160.from(0);
	let amountIn: Uint256 = Uint256.from(0);
	let amountOut: Uint256 = Uint256.from(0);
	let feeAmount: Uint256 = Uint256.from(0);

	const zeroForOne = Uint160.from(sqrtRatioCurrentX96).gte(sqrtRatioTargetX96);
	const exactIn = Int256.from(amountRemaining).gte(0);

	if (exactIn) {
		const amountRemainingLessFee: Uint256 = Uint256.from(
			FullMath.mulDiv(
				Uint256.from(amountRemaining).toString(),
				Uint24.from(1000000).sub(feePips).toString(),
				'1000000',
			),
		);
		amountIn = zeroForOne
			? Uint256.from(
					SqrtPriceMath.getAmount0DeltaHelper(
						sqrtRatioTargetX96,
						sqrtRatioCurrentX96,
						liquidity,
						true,
					),
			  )
			: Uint256.from(
					SqrtPriceMath.getAmount1DeltaHelper(
						sqrtRatioCurrentX96,
						sqrtRatioTargetX96,
						liquidity,
						true,
					),
			  );
		if (amountRemainingLessFee.gte(amountIn)) sqrtRatioNextX96 = Uint160.from(sqrtRatioTargetX96);
		else
			sqrtRatioNextX96 = Uint160.from(
				SqrtPriceMath.getNextSqrtPriceFromInput(
					sqrtRatioCurrentX96,
					liquidity,
					amountRemainingLessFee.toString(),
					zeroForOne,
				),
			);
	} else {
		amountOut = zeroForOne
			? Uint256.from(
					SqrtPriceMath.getAmount1DeltaHelper(
						sqrtRatioTargetX96,
						sqrtRatioCurrentX96,
						liquidity,
						false,
					),
			  )
			: Uint256.from(
					SqrtPriceMath.getAmount0DeltaHelper(
						sqrtRatioCurrentX96,
						sqrtRatioTargetX96,
						liquidity,
						false,
					),
			  );
		if (Uint256.from(0).sub(amountRemaining).gte(amountOut))
			sqrtRatioNextX96 = Uint160.from(sqrtRatioTargetX96);
		else
			sqrtRatioNextX96 = Uint160.from(
				SqrtPriceMath.getNextSqrtPriceFromOutput(
					sqrtRatioCurrentX96,
					liquidity,
					Uint256.from(0).sub(amountRemaining).toString(),
					zeroForOne,
				),
			);
	}

	const max = sqrtRatioNextX96.eq(sqrtRatioTargetX96);

	if (zeroForOne) {
		amountIn =
			max && exactIn
				? amountIn
				: Uint256.from(
						SqrtPriceMath.getAmount0DeltaHelper(
							sqrtRatioNextX96.toString(),
							sqrtRatioCurrentX96,
							liquidity,
							true,
						),
				  );
		amountOut =
			max && !exactIn
				? amountOut
				: Uint256.from(
						SqrtPriceMath.getAmount1DeltaHelper(
							sqrtRatioNextX96.toString(),
							sqrtRatioCurrentX96,
							liquidity,
							false,
						),
				  );
	} else {
		amountIn =
			max && exactIn
				? amountIn
				: Uint256.from(
						SqrtPriceMath.getAmount1DeltaHelper(
							sqrtRatioCurrentX96,
							sqrtRatioNextX96.toString(),
							liquidity,
							true,
						),
				  );
		amountOut =
			max && !exactIn
				? amountOut
				: Uint256.from(
						SqrtPriceMath.getAmount0DeltaHelper(
							sqrtRatioCurrentX96,
							sqrtRatioNextX96.toString(),
							liquidity,
							false,
						),
				  );
	}

	if (!exactIn && amountOut.gt(Uint256.from(0).sub(amountRemaining))) {
		amountOut = Uint256.from(0).sub(amountRemaining);
	}

	if (exactIn && !sqrtRatioNextX96.eq(sqrtRatioTargetX96)) {
		feeAmount = Uint256.from(amountRemaining).sub(amountIn);
	} else {
		feeAmount = Uint256.from(
			FullMath.mulDivRoundingUp(
				amountIn.toString(),
				feePips,
				Uint24.from(1000000).sub(feePips).toString(),
			),
		);
	}

	return [
		sqrtRatioNextX96.toString(),
		amountIn.toString(),
		amountOut.toString(),
		feeAmount.toString(),
	];
}
