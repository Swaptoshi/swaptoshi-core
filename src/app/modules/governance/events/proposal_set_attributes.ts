import { BaseEvent } from 'klayr-sdk';
import { proposalSetAttributesEventSchema } from '../schema';
import { ProposalSetAttributesEventData } from '../types';

export class ProposalSetAttributesEvent extends BaseEvent<ProposalSetAttributesEventData> {
	public schema = proposalSetAttributesEventSchema;
}
