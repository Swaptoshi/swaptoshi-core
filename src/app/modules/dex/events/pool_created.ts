import { BaseEvent } from 'lisk-sdk';
import { poolCreatedEventSchema } from '../schema/events/pool_created';

export interface PoolCreatedEventData {
	token0: Buffer;
	token1: Buffer;
	fee: string;
	tickSpacing: string;
	poolAddress: Buffer;
}

export class PoolCreatedEvent extends BaseEvent<PoolCreatedEventData> {
	public schema = poolCreatedEventSchema;
}
