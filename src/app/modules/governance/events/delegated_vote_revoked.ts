import { BaseEvent } from 'klayr-sdk';
import { delegatedVoteRevokedEventSchema } from '../schema';
import { DelegatedVoteRevokedEventData } from '../types';

export class DelegatedVoteRevokedEvent extends BaseEvent<DelegatedVoteRevokedEventData> {
	public schema = delegatedVoteRevokedEventSchema;
}
