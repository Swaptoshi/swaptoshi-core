import { Uint24String, Uint256String, Uint160String } from '../../stores/library/int';

export interface ExactInputSingleParams {
	tokenIn: Buffer;
	tokenOut: Buffer;
	fee: Uint24String;
	recipient: Buffer;
	deadline: Uint256String;
	amountIn: Uint256String;
	amountOutMinimum: Uint256String;
	sqrtPriceLimitX96: Uint160String;
}
