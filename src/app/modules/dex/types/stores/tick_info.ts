import {
	Uint128String,
	Int128String,
	Uint256String,
	Int56String,
	Uint160String,
	Uint32String,
} from '../../stores/library/int';

export interface TickInfo {
	liquidityGross: Uint128String;
	liquidityNet: Int128String;
	feeGrowthOutside0X128: Uint256String;
	feeGrowthOutside1X128: Uint256String;
	tickCumulativeOutside: Int56String;
	secondsPerLiquidityOutsideX128: Uint160String;
	secondsOutside: Uint32String;
	initialized: boolean;
}
