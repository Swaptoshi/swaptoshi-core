import { BaseEvent } from 'lisk-sdk';
import { vestedTokenLockedEventSchema } from '../schema';
import { VestedTokenLockedEventData } from '../types';

export class VestedTokenLockedEvent extends BaseEvent<VestedTokenLockedEventData> {
	public schema = vestedTokenLockedEventSchema;
}
