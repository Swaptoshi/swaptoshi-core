import { Modules } from 'klayr-sdk';
import { proposalVotedEventSchema } from '../schema';
import { ProposalVotedEventData } from '../types';

export class ProposalVotedEvent extends Modules.BaseEvent<ProposalVotedEventData> {
	public schema = proposalVotedEventSchema;
}
