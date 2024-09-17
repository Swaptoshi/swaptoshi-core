import { Modules } from 'klayr-sdk';
import { vestedTokenUnlockedEventSchema } from '../schema';
import { VestedTokenUnlockedEventData } from '../types';

export class VestedTokenUnlockedEvent extends Modules.BaseEvent<VestedTokenUnlockedEventData> {
	public schema = vestedTokenUnlockedEventSchema;
}
