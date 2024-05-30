import { BaseEvent } from 'klayr-sdk';
import { ICOTreasurifyEventData } from '../types';
import { icoTreasurifyEventSchema } from '../schema';

export class IcoTreasurifyEvent extends BaseEvent<ICOTreasurifyEventData> {
	public schema = icoTreasurifyEventSchema;
}
