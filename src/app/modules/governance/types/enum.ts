export enum QuorumMode {
	FOR_AGAINST_ABSTAIN = 0,
	FOR_AGAINST = 1,
	FOR = 2,
}

export enum Votes {
	FOR = 0,
	AGAINST = 1,
	ABSTAIN = 2,
}

export enum ProposalStatus {
	ACTIVE = 0,
	ACCEPTED = 1,
	ACCEPTED_WITH_ERROR = 2,
	REJECTED = 3,
	FAILED_QUORUM = 4,
}
