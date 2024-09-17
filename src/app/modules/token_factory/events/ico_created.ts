import { Modules } from 'klayr-sdk';
import { icoCreatedEventSchema } from '../schema';
import { ICOCreatedEventData } from '../types';

export class IcoCreatedEvent extends Modules.BaseEvent<ICOCreatedEventData> {
	public schema = icoCreatedEventSchema;
}
