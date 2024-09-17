import { Modules } from 'klayr-sdk';
import { delegatedVoteRevokedEventSchema } from '../schema';
import { DelegatedVoteRevokedEventData } from '../types';

export class DelegatedVoteRevokedEvent extends Modules.BaseEvent<DelegatedVoteRevokedEventData> {
	public schema = delegatedVoteRevokedEventSchema;
}
