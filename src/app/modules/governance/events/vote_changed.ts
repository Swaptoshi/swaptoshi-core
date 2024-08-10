import { BaseEvent } from 'klayr-sdk';
import { voteChangedEventSchema } from '../schema';
import { VoteChangedEventData } from '../types';

export class VoteChangedEvent extends BaseEvent<VoteChangedEventData> {
	public schema = voteChangedEventSchema;
}
