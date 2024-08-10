/* eslint-disable import/no-cycle */
/* eslint-disable no-param-reassign */
import { cryptography } from 'klayr-sdk';
import { Uint256String, Int24String, Int128String, Uint128, Int128, Uint256 } from '../int';
import { PositionInfoStore } from '../../position_info';
import { ImmutableContext, MutableContext, PositionInfo } from '../../../types';

import * as LiquidityMath from './liquidity_math';
import * as FullMath from './full_math';
import * as FixedPoint128 from './fixed_point_128';

export function positionKey(owner: Buffer, tickLower: string, tickUpper: string): Buffer {
	return cryptography.utils.hash(`${owner.toString('hex')}${tickLower}${tickUpper}`, 'utf8');
}

export async function get(positionInfoStore: PositionInfoStore, context: ImmutableContext, poolAddress: Buffer, owner: Buffer, tickLower: Int24String, tickUpper: Int24String): Promise<PositionInfo> {
	return positionInfoStore.getOrDefault(context, positionInfoStore.getKey(poolAddress, positionKey(owner, tickLower, tickUpper)));
}

export async function set(
	positionInfoStore: PositionInfoStore,
	context: MutableContext,
	poolAddress: Buffer,
	owner: Buffer,
	tickLower: Int24String,
	tickUpper: Int24String,
	position: PositionInfo,
): Promise<void> {
	await positionInfoStore.set(context, positionInfoStore.getKey(poolAddress, positionKey(owner, tickLower, tickUpper)), position);
}

export function update(self: PositionInfo, liquidityDelta: Int128String, feeGrowthInside0X128: Uint256String, feeGrowthInside1X128: Uint256String): void {
	const _self = self;
	let liquidityNext: Uint128;

	if (Int128.from(liquidityDelta).eq(0)) {
		if (Uint128.from(_self.liquidity).lte(0)) throw new Error('NP');
		liquidityNext = Uint128.from(_self.liquidity);
	} else {
		liquidityNext = Uint128.from(LiquidityMath.addDelta(_self.liquidity, liquidityDelta));
	}

	const tokensOwed0: Uint128 = Uint128.from(0).add(FullMath.mulDiv(Uint256.from(feeGrowthInside0X128).sub(_self.feeGrowthInside0LastX128).toString(), _self.liquidity, FixedPoint128.Q128));
	const tokensOwed1: Uint128 = Uint128.from(0).add(FullMath.mulDiv(Uint256.from(feeGrowthInside1X128).sub(_self.feeGrowthInside1LastX128).toString(), _self.liquidity, FixedPoint128.Q128));

	if (!Int128.from(liquidityDelta).eq(0)) self.liquidity = liquidityNext.toString();
	self.feeGrowthInside0LastX128 = feeGrowthInside0X128;
	self.feeGrowthInside1LastX128 = feeGrowthInside1X128;
	if (tokensOwed0.gt(0) || tokensOwed1.gt(0)) {
		self.tokensOwed0 = Uint128.from(self.tokensOwed0).add(tokensOwed0).toString();
		self.tokensOwed1 = Uint128.from(self.tokensOwed1).add(tokensOwed1).toString();
	}
}
