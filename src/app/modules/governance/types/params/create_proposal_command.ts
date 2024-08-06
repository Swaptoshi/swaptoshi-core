import { ProposalActions, ProposalAttributes } from '../stores';

export interface CreateProposalParams {
	title: string;
	summary: string;
	actions: ProposalActions[];
	attributes: ProposalAttributes[];
}
