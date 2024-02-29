import { BaseEvent } from 'lisk-sdk';
import { icoCreatedEventSchema } from '../schema';
import { ICOCreatedEventData } from '../types';

export class IcoCreatedEvent extends BaseEvent<ICOCreatedEventData> {
	public schema = icoCreatedEventSchema;
}
