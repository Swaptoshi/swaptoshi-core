import { BaseEvent } from 'lisk-sdk';
import { factoryCreatedEventSchema } from '../schema';
import { FactoryCreatedEventData } from '../types';

export class FactoryCreatedEvent extends BaseEvent<FactoryCreatedEventData> {
	public schema = factoryCreatedEventSchema;
}
