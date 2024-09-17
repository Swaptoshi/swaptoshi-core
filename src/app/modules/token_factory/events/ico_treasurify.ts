import { Modules } from 'klayr-sdk';
import { ICOTreasurifyEventData } from '../types';
import { icoTreasurifyEventSchema } from '../schema';

export class IcoTreasurifyEvent extends Modules.BaseEvent<ICOTreasurifyEventData> {
	public schema = icoTreasurifyEventSchema;
}
