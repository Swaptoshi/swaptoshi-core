import { Modules } from 'klayr-sdk';
import { proposalActiveEventSchema } from '../schema';
import { ProposalActiveEventData } from '../types';

export class ProposalActiveEvent extends Modules.BaseEvent<ProposalActiveEventData> {
	public schema = proposalActiveEventSchema;
}
