import { Uint256String } from '../../stores/library/int';

export interface QuoteExactOutputParams {
	path: string;
	amountOut: Uint256String;
}
