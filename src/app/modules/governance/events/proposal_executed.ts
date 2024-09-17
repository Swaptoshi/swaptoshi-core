import { Modules } from 'klayr-sdk';
import { proposalExecutedEventSchema } from '../schema';
import { ProposalExecutedEventData } from '../types';

export class ProposalExecutedEvent extends Modules.BaseEvent<ProposalExecutedEventData> {
	public schema = proposalExecutedEventSchema;
}
