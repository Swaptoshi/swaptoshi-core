export interface GovernanceModuleConfig {
	proposalCreationMinBalance: string;
	proposalCreationDeposit: string;
	maxProposalActions: number;
	votingDelayDuration: number;
	voteDuration: number;
	quorumDuration: number;
	executionDuration: number;
	quorumPercentage: number;
	quorumMode: number;
	depositPoolAddress: string;
	enableTurnoutBias: boolean;
	enableBoosting: boolean;
	maxBoostDuration: number;
	boostFactor: number;
	treasuryAddress: string;
	treasuryReward: {
		tokenID: string;
		offset: number;
		distance: number;
		mintBracket: string[];
		blockRewardTaxBracket: string[];
	};
	minTransactionFee: {
		createProposal: string;
		vote: string;
		boostVote: string;
		delegateVote: string;
		revokeDelegatedVote: string;
		setProposalAttributes: string;
	};
	baseFee: {
		createProposal: string;
		vote: string;
		boostVote: string;
		delegateVote: string;
		revokeDelegatedVote: string;
		setProposalAttributes: string;
	};
}
