import {
	Uint160String,
	Int24String,
	Uint16String,
	Uint128String,
	Uint256String,
	Uint24String,
} from '../../stores/library/int';

export interface Slot0 {
	sqrtPriceX96: Uint160String;
	tick: Int24String;
	observationIndex: Uint16String;
	observationCardinality: Uint16String;
	observationCardinalityNext: Uint16String;
}

export interface DEXPoolData {
	token0: Buffer;
	token1: Buffer;
	fee: Uint24String;
	tickSpacing: Int24String;
	maxLiquidityPerTick: Uint128String;
	feeGrowthGlobal0X128: Uint256String;
	feeGrowthGlobal1X128: Uint256String;
	liquidity: Uint128String;
	slot0: Slot0;
}
