import { BaseEvent } from 'lisk-sdk';
import { poolInitializedEventSchema } from '../schema/events/pool_initialized';

export interface PoolInitializedEventData {
	sqrtPriceX96: string;
	tick: string;
}

export class PoolInitializedEvent extends BaseEvent<PoolInitializedEventData> {
	public schema = poolInitializedEventSchema;
}
