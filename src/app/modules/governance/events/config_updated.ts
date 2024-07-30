import { BaseEvent } from 'klayr-sdk';
import { configUpdatedEventSchema } from '../schema/events/config_updated';

export interface ConfigUpdatedEventData {
	module: string;
	path: string;
	old: string;
	new: string;
	type: string;
}

export class ConfigUpdatedEvent extends BaseEvent<ConfigUpdatedEventData> {
	public schema = configUpdatedEventSchema;
}
