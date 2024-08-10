/* eslint-disable import/no-cycle */
import { BaseEvent } from 'klayr-sdk';
import { poolCreatedEventSchema } from '../schema';

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
