/* eslint-disable import/no-cycle */
import { BaseEvent } from 'klayr-sdk';
import { swapEventSchema } from '../schema';

export interface SwapEventData {
	senderAddress: Buffer;
	recipientAddress: Buffer;
	amount0: string;
	amount1: string;
	sqrtPriceX96Before: string;
	sqrtPriceX96: string;
	liquidityBefore: string;
	liquidity: string;
	tickBefore: string;
	tick: string;
	feeGrowthGlobal0X128Before: string;
	feeGrowthGlobal0X128: string;
	feeGrowthGlobal1X128Before: string;
	feeGrowthGlobal1X128: string;
}

export class SwapEvent extends BaseEvent<SwapEventData> {
	public schema = swapEventSchema;
}
