import { BaseEvent } from 'lisk-sdk';
import { icoCreatedEventSchema } from '../schema';
import { ICOCreatedEventData } from '../types';

export class ICOCreatedEvent extends BaseEvent<ICOCreatedEventData> {
	public schema = icoCreatedEventSchema;
}
