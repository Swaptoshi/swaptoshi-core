import { BaseEvent } from 'klayr-sdk';
import { poolInitializedEventSchema } from '../schema';

export interface PoolInitializedEventData {
	sqrtPriceX96: string;
	tick: string;
}

export class PoolInitializedEvent extends BaseEvent<PoolInitializedEventData> {
	public schema = poolInitializedEventSchema;
}
