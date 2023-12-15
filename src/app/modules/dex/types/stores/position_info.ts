import { Uint128String, Uint256String } from '../../stores/library/int';

export interface PositionInfo {
	liquidity: Uint128String;
	feeGrowthInside0LastX128: Uint256String;
	feeGrowthInside1LastX128: Uint256String;
	tokensOwed0: Uint128String;
	tokensOwed1: Uint128String;
}
