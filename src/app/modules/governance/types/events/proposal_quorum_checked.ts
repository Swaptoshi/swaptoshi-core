import { ProposalStatus } from '../enum';

export interface ProposalQuorumCheckedEventData {
	proposalId: number;
	status: ProposalStatus.ACTIVE | ProposalStatus.FAILED_QUORUM;
}
