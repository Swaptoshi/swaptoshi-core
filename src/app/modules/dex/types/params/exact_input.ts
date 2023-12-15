import { Uint256String } from '../../stores/library/int';

export interface ExactInputParams {
	path: Buffer;
	recipient: Buffer;
	deadline: Uint256String;
	amountIn: Uint256String;
	amountOutMinimum: Uint256String;
}
