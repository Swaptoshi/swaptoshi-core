import { GovernableConfigStoreData } from './governable_config';
import {
	BoostedAccountStoreData,
	CastedVoteStoreData,
	DelegatedVoteStoreData,
	NextAvailableProposalIdStoreData,
	ProposalQueueStoreData,
	ProposalStoreData,
	ProposalVoterStoreData,
	VoteScoreStoreData,
} from './stores';

export interface GovernanceGenesisStore {
	boostedAccountSubstore: BoostedAccountGenesisSubstore[];
	castedVoteSubstore: CastedVoteGenesisSubstore[];
	delegatedVoteSubstore: DelegatedVoteGenesisSubstore[];
	nextAvailableProposalIdSubstore: NextAvailableProposalIdStoreData;
	proposalVoterSubstore: ProposalVoterGenesisSubstore[];
	proposalSubstore: ProposalGenesisSubstore[];
	queueSubstore: ProposalQueueGenesisSubstore[];
	voteScoreSubstore: VoteScoreGenesisSubstore[];
	configSubstore: ConfigGenesisSubstore[];
}

interface ConfigGenesisSubstore extends GovernableConfigStoreData {
	module: string;
}

interface BoostedAccountGenesisSubstore extends BoostedAccountStoreData {
	address: Buffer;
}

interface CastedVoteGenesisSubstore extends CastedVoteStoreData {
	address: Buffer;
}

interface DelegatedVoteGenesisSubstore extends DelegatedVoteStoreData {
	address: Buffer;
}

interface ProposalVoterGenesisSubstore extends ProposalVoterStoreData {
	proposalId: number;
}

interface ProposalGenesisSubstore extends ProposalStoreData {
	proposalId: number;
}

interface ProposalQueueGenesisSubstore extends ProposalQueueStoreData {
	height: number;
}

interface VoteScoreGenesisSubstore extends VoteScoreStoreData {
	address: Buffer;
}
