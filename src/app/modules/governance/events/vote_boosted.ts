import { BaseEvent } from 'klayr-sdk';
import { VoteBoostedEventSchema } from '../schema';
import { VoteBoostedEventData } from '../types';

export class VoteBoostedEvent extends BaseEvent<VoteBoostedEventData> {
	public schema = VoteBoostedEventSchema;
}
