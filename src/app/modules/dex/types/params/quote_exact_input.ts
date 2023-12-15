import { Uint256String } from '../../stores/library/int';

export interface QuoteExactInputParams {
	path: string;
	amountIn: Uint256String;
}
