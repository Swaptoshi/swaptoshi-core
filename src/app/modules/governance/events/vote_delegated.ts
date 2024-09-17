import { Modules } from 'klayr-sdk';
import { voteDelegatedEventSchema } from '../schema';
import { VoteDelegatedEventData } from '../types';

export class VoteDelegatedEvent extends Modules.BaseEvent<VoteDelegatedEventData> {
	public schema = voteDelegatedEventSchema;
}
