import { Uint256String } from '../../stores/library/int';

export interface ExactOutputParams {
	path: Buffer;
	recipient: Buffer;
	deadline: Uint256String;
	amountOut: Uint256String;
	amountInMaximum: Uint256String;
}
