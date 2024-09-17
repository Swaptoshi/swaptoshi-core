/* eslint-disable import/no-cycle */
import { Modules } from 'klayr-sdk';
import { decreaseLiquidityEventSchema } from '../schema';

export interface DecreaseLiquidityEventData {
	tokenId: Buffer;
	liquidity: string;
	amount0: string;
	amount1: string;
}

export class DecreaseLiquidityEvent extends Modules.BaseEvent<DecreaseLiquidityEventData> {
	public schema = decreaseLiquidityEventSchema;
}
