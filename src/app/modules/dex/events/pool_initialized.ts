/* eslint-disable import/no-cycle */
import { Modules } from 'klayr-sdk';
import { poolInitializedEventSchema } from '../schema';

export interface PoolInitializedEventData {
	sqrtPriceX96: string;
	tick: string;
}

export class PoolInitializedEvent extends Modules.BaseEvent<PoolInitializedEventData> {
	public schema = poolInitializedEventSchema;
}
