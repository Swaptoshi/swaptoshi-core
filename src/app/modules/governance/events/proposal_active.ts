import { BaseEvent } from 'klayr-sdk';
import { proposalActiveEventSchema } from '../schema';
import { ProposalActiveEventData } from '../types';

export class ProposalActiveEvent extends BaseEvent<ProposalActiveEventData> {
	public schema = proposalActiveEventSchema;
}
