import { Modules } from 'klayr-sdk';
import { configRegisteredEventSchema } from '../schema';
import { ConfigRegisteredEventData } from '../types';

export class ConfigRegisteredEvent extends Modules.BaseEvent<ConfigRegisteredEventData> {
	public schema = configRegisteredEventSchema;
}
