import { BaseEvent } from 'klayr-sdk';
import { proposalOutcomeEventSchema } from '../schema';
import { ProposalOutcomeEventData } from '../types';

export class ProposalOutcomeEvent extends BaseEvent<ProposalOutcomeEventData> {
	public schema = proposalOutcomeEventSchema;
}
