import { Modules } from 'klayr-sdk';
import { factoryOwnerChangedEventSchema } from '../schema';
import { FactoryOwnerChangedEventData } from '../types';

export class FactoryOwnerChangedEvent extends Modules.BaseEvent<FactoryOwnerChangedEventData> {
	public schema = factoryOwnerChangedEventSchema;
}
