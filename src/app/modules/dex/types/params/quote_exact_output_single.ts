import { Uint256String, Uint24String, Uint160String } from '../../stores/library/int';

export interface QuoteExactOutputSingleParams {
	tokenIn: string;
	tokenOut: string;
	amount: Uint256String;
	fee: Uint24String;
	sqrtPriceLimitX96: Uint160String;
}
