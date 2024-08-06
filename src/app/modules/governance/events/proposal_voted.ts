import { BaseEvent } from 'klayr-sdk';
import { proposalVotedEventSchema } from '../schema';
import { ProposalVotedEventData } from '../types';

export class ProposalVotedEvent extends BaseEvent<ProposalVotedEventData> {
	public schema = proposalVotedEventSchema;
}
