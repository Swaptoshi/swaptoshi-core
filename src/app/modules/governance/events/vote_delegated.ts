import { BaseEvent } from 'klayr-sdk';
import { voteDelegatedEventSchema } from '../schema';
import { VoteDelegatedEventData } from '../types';

export class VoteDelegatedEvent extends BaseEvent<VoteDelegatedEventData> {
	public schema = voteDelegatedEventSchema;
}
