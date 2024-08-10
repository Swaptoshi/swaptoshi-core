import { BaseEvent } from 'klayr-sdk';
import { voteBoostedEventSchema } from '../schema';
import { VoteBoostedEventData } from '../types';

export class VoteBoostedEvent extends BaseEvent<VoteBoostedEventData> {
	public schema = voteBoostedEventSchema;
}
