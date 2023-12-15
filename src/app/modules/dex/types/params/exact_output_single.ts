import { Uint24String, Uint256String, Uint160String } from '../../stores/library/int';

export interface ExactOutputSingleParams {
	tokenIn: Buffer;
	tokenOut: Buffer;
	fee: Uint24String;
	recipient: Buffer;
	deadline: Uint256String;
	amountOut: Uint256String;
	amountInMaximum: Uint256String;
	sqrtPriceLimitX96: Uint160String;
}
