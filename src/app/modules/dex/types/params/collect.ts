import { Uint128String, Uint64String } from '../../stores/library/int';

export interface CollectParams {
	poolAddress: Buffer;
	tokenId: Uint64String;
	recipient: Buffer;
	amount0Max: Uint128String;
	amount1Max: Uint128String;
}
