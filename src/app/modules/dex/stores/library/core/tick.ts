/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
	Uint128String,
	Int128String,
	Uint256String,
	Int56String,
	Uint160String,
	Uint32String,
	Int24String,
	Int24,
	Uint24,
	Uint128,
	Uint256,
	Int128,
	Int256,
	Uint160,
	Int56,
	Uint32,
} from '../int';
import { TickInfoStore } from '../../tick_info';

import * as TickMath from './tick_math';
import * as LiquidityMath from './liquidity_math';
import { ImmutableContext, MutableContext, TickInfo } from '../../../types';

export function tickSpacingToMaxLiquidityPerTick(tickSpacing: Int24String): Uint128String {
	const minTick = Int24.from(TickMath.MIN_TICK).div(tickSpacing).mul(tickSpacing);
	const maxTick = Int24.from(TickMath.MAX_TICK).div(tickSpacing).mul(tickSpacing);
	const numTicks = Uint24.from(maxTick).sub(minTick).div(tickSpacing).add(1);
	return Uint128.from(Uint128.MAX).div(numTicks).toString();
}

export async function getFeeGrowthInside(
	tickInfoStore: TickInfoStore,
	context: ImmutableContext,
	poolAddress: Buffer,
	tickLower: Int24String,
	tickUpper: Int24String,
	tickCurrent: Int24String,
	feeGrowthGlobal0X128: Uint256String,
	feeGrowthGlobal1X128: Uint256String,
): Promise<[feeGrowthInside0X128: Uint256String, feeGrowthInside1X128: Uint256String]> {
	const lower = await tickInfoStore.getOrDefault(
		context,
		tickInfoStore.getKey(poolAddress, tickLower),
	);
	const upper = await tickInfoStore.getOrDefault(
		context,
		tickInfoStore.getKey(poolAddress, tickUpper),
	);

	let feeGrowthBelow0X128: Uint256;
	let feeGrowthBelow1X128: Uint256;

	if (Int24.from(tickCurrent).gte(tickLower)) {
		feeGrowthBelow0X128 = Uint256.from(lower.feeGrowthOutside0X128);
		feeGrowthBelow1X128 = Uint256.from(lower.feeGrowthOutside1X128);
	} else {
		feeGrowthBelow0X128 = Uint256.from(feeGrowthGlobal0X128).sub(lower.feeGrowthOutside0X128);
		feeGrowthBelow1X128 = Uint256.from(feeGrowthGlobal1X128).sub(lower.feeGrowthOutside1X128);
	}

	let feeGrowthAbove0X128: Uint256;
	let feeGrowthAbove1X128: Uint256;

	if (Int24.from(tickCurrent).lt(tickUpper)) {
		feeGrowthAbove0X128 = Uint256.from(upper.feeGrowthOutside0X128);
		feeGrowthAbove1X128 = Uint256.from(upper.feeGrowthOutside1X128);
	} else {
		feeGrowthAbove0X128 = Uint256.from(feeGrowthGlobal0X128).sub(upper.feeGrowthOutside0X128);
		feeGrowthAbove1X128 = Uint256.from(feeGrowthGlobal1X128).sub(upper.feeGrowthOutside1X128);
	}

	const feeGrowthInside0X128 = Uint256.from(feeGrowthGlobal0X128)
		.sub(feeGrowthBelow0X128)
		.sub(feeGrowthAbove0X128)
		.toString();
	const feeGrowthInside1X128 = Uint256.from(feeGrowthGlobal1X128)
		.sub(feeGrowthBelow1X128)
		.sub(feeGrowthAbove1X128)
		.toString();

	return [feeGrowthInside0X128, feeGrowthInside1X128];
}

export async function update(
	tickInfoStore: TickInfoStore,
	context: MutableContext,
	poolAddress: Buffer,
	tick: Int24String,
	tickCurrent: Int24String,
	liquidityDelta: Int128String,
	feeGrowthGlobal0X128: Uint256String,
	feeGrowthGlobal1X128: Uint256String,
	secondsPerLiquidityCumulativeX128: Uint160String,
	tickCumulative: Int56String,
	time: Uint32String,
	upper: boolean,
	maxLiquidity: Uint128String,
	simulation = false,
): Promise<[flipped: boolean, tickInfo: TickInfo]> {
	const info = await tickInfoStore.getOrDefault(context, tickInfoStore.getKey(poolAddress, tick));

	const liquidityGrossBefore: Uint128 = Uint128.from(info.liquidityGross);
	const liquidityGrossAfter: Uint128 = Uint128.from(
		LiquidityMath.addDelta(liquidityGrossBefore.toString(), liquidityDelta),
	);

	if (liquidityGrossAfter.gt(maxLiquidity)) throw new Error('LO');

	const flipped = liquidityGrossAfter.eq(0) !== liquidityGrossBefore.eq(0);

	if (liquidityGrossBefore.eq(0)) {
		if (Int24.from(tick).lte(tickCurrent)) {
			info.feeGrowthOutside0X128 = feeGrowthGlobal0X128;
			info.feeGrowthOutside1X128 = feeGrowthGlobal1X128;
			info.secondsPerLiquidityOutsideX128 = secondsPerLiquidityCumulativeX128;
			info.tickCumulativeOutside = tickCumulative;
			info.secondsOutside = time;
		}
		info.initialized = true;
	}

	info.liquidityGross = liquidityGrossAfter.toString();
	info.liquidityNet = upper
		? Int128.from(Int256.from(info.liquidityNet).sub(liquidityDelta)).toString()
		: Int128.from(Int256.from(info.liquidityNet).add(liquidityDelta)).toString();

	if (!simulation) {
		await tickInfoStore.set(context, tickInfoStore.getKey(poolAddress, tick), info);
	}

	return [flipped, info];
}

export async function clear(
	tickInfoStore: TickInfoStore,
	context: MutableContext,
	poolAddress: Buffer,
	tick: Int24String,
	simulation = false,
) {
	if (!simulation) {
		await tickInfoStore.del(context, tickInfoStore.getKey(poolAddress, tick));
	}
}

export async function cross(
	tickInfoStore: TickInfoStore,
	context: MutableContext,
	poolAddress: Buffer,
	tick: Int24String,
	feeGrowthGlobal0X128: Uint256String,
	feeGrowthGlobal1X128: Uint256String,
	secondsPerLiquidityCumulativeX128: Uint160String,
	tickCumulative: Int56String,
	time: Uint32String,
	simulation = false,
): Promise<Int128String> {
	const info = await tickInfoStore.getOrDefault(context, tickInfoStore.getKey(poolAddress, tick));

	info.feeGrowthOutside0X128 = Uint256.from(feeGrowthGlobal0X128)
		.sub(info.feeGrowthOutside0X128)
		.toString();
	info.feeGrowthOutside1X128 = Uint256.from(feeGrowthGlobal1X128)
		.sub(info.feeGrowthOutside1X128)
		.toString();
	info.secondsPerLiquidityOutsideX128 = Uint160.from(secondsPerLiquidityCumulativeX128)
		.sub(info.secondsPerLiquidityOutsideX128)
		.toString();
	info.tickCumulativeOutside = Int56.from(tickCumulative)
		.sub(info.tickCumulativeOutside)
		.toString();
	info.secondsOutside = Uint32.from(time).sub(info.secondsOutside).toString();

	if (!simulation) {
		await tickInfoStore.set(context, tickInfoStore.getKey(poolAddress, tick), info);
	}

	return info.liquidityNet;
}
