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
	CREATED = 0,
	ACTIVE = 1,
	ACCEPTED = 2,
	REJECTED = 3,
	EXECUTED = 4,
	EXECUTED_WITH_ERROR = 5,
	FAILED_QUORUM = 6,
}
