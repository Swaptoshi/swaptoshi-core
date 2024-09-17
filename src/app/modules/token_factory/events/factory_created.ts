import { Modules } from 'klayr-sdk';
import { factoryCreatedEventSchema } from '../schema';
import { FactoryCreatedEventData } from '../types';

export class FactoryCreatedEvent extends Modules.BaseEvent<FactoryCreatedEventData> {
	public schema = factoryCreatedEventSchema;
}
