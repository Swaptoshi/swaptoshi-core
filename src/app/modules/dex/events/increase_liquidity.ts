import { BaseEvent } from 'lisk-sdk';
import { increaseLiquidityEventSchema } from '../schema/events/increase_liquidity';

export interface IncreaseLiquidityEventData {
	tokenId: Buffer;
	liquidity: string;
	amount0: string;
	amount1: string;
	ownerAddress: Buffer;
}

export class IncreaseLiquidityEvent extends BaseEvent<IncreaseLiquidityEventData> {
	public schema = increaseLiquidityEventSchema;
}
