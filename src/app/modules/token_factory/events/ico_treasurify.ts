import { BaseEvent } from 'lisk-sdk';
import { ICOTreasurifyEventData } from '../types';
import { icoTreasurifyEventSchema } from '../schema';

export class ICOTreasurifyEvent extends BaseEvent<ICOTreasurifyEventData> {
	public schema = icoTreasurifyEventSchema;
}
