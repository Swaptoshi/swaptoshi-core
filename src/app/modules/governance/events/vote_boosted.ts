import { Modules } from 'klayr-sdk';
import { voteBoostedEventSchema } from '../schema';
import { VoteBoostedEventData } from '../types';

export class VoteBoostedEvent extends Modules.BaseEvent<VoteBoostedEventData> {
	public schema = voteBoostedEventSchema;
}
