import { Uint160String, Uint24String, Uint256String } from '../../stores/library/int';

export interface QuoteExactInputSingleParams {
	tokenIn: string;
	tokenOut: string;
	amountIn: Uint256String;
	fee: Uint24String;
	sqrtPriceLimitX96: Uint160String;
}
