import { Uint64String, Uint128String, Uint256String } from '../../stores/library/int';

export interface DecreaseLiquidityParams {
	poolAddress: Buffer;
	tokenId: Uint64String;
	liquidity: Uint128String;
	amount0Min: Uint256String;
	amount1Min: Uint256String;
	deadline: Uint256String;
}
