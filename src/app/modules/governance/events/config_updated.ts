import { Modules } from 'klayr-sdk';
import { configUpdatedEventSchema } from '../schema';
import { ConfigUpdatedEventData } from '../types';

export class ConfigUpdatedEvent extends Modules.BaseEvent<ConfigUpdatedEventData> {
	public schema = configUpdatedEventSchema;
}
