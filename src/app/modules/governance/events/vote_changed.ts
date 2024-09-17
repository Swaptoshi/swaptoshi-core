import { Modules } from 'klayr-sdk';
import { voteChangedEventSchema } from '../schema';
import { VoteChangedEventData } from '../types';

export class VoteChangedEvent extends Modules.BaseEvent<VoteChangedEventData> {
	public schema = voteChangedEventSchema;
}
