import { BaseEvent } from 'lisk-sdk';
import { vestedTokenUnlockedEventSchema } from '../schema';
import { VestedTokenUnlockedEventData } from '../types';

export class VestedTokenUnlockedEvent extends BaseEvent<VestedTokenUnlockedEventData> {
	public schema = vestedTokenUnlockedEventSchema;
}
