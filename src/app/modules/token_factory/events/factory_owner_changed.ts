import { BaseEvent } from 'klayr-sdk';
import { factoryOwnerChangedEventSchema } from '../schema';
import { FactoryOwnerChangedEventData } from '../types';

export class FactoryOwnerChangedEvent extends BaseEvent<FactoryOwnerChangedEventData> {
	public schema = factoryOwnerChangedEventSchema;
}
