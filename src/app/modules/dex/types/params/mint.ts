import { Uint24String, Int24String, Uint256String } from '../../stores/library/int';

export interface MintParams {
	token0: Buffer;
	token1: Buffer;
	fee: Uint24String;
	tickLower: Int24String;
	tickUpper: Int24String;
	amount0Desired: Uint256String;
	amount1Desired: Uint256String;
	amount0Min: Uint256String;
	amount1Min: Uint256String;
	recipient: Buffer;
	deadline: Uint256String;
}
