import { BaseEvent } from 'klayr-sdk';
import { proposalQuorumCheckedEventSchema } from '../schema';
import { ProposalQuorumCheckedEventData } from '../types';

export class ProposalQuorumCheckedEvent extends BaseEvent<ProposalQuorumCheckedEventData> {
	public schema = proposalQuorumCheckedEventSchema;
}
