import { BaseEvent } from 'klayr-sdk';
import { proposalCreatedEventSchema } from '../schema';
import { ProposalCreatedEventData } from '../types';

export class ProposalCreatedEvent extends BaseEvent<ProposalCreatedEventData> {
	public schema = proposalCreatedEventSchema;
}
