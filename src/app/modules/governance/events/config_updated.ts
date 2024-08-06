import { BaseEvent } from 'klayr-sdk';
import { configUpdatedEventSchema } from '../schema';
import { ConfigUpdatedEventData } from '../types';

export class ConfigUpdatedEvent extends BaseEvent<ConfigUpdatedEventData> {
	public schema = configUpdatedEventSchema;
}
