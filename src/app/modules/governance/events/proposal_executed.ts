import { BaseEvent } from 'klayr-sdk';
import { proposalExecutedEventSchema } from '../schema';
import { ProposalExecutedEventData } from '../types';

export class ProposalExecutedEvent extends BaseEvent<ProposalExecutedEventData> {
	public schema = proposalExecutedEventSchema;
}
