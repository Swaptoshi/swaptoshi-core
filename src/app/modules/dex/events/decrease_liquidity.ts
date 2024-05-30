import { BaseEvent } from 'klayr-sdk';
import { decreaseLiquidityEventSchema } from '../schema/events/decrease_liquidity';

export interface DecreaseLiquidityEventData {
	tokenId: Buffer;
	liquidity: string;
	amount0: string;
	amount1: string;
}

export class DecreaseLiquidityEvent extends BaseEvent<DecreaseLiquidityEventData> {
	public schema = decreaseLiquidityEventSchema;
}
