export interface GovernanceModuleConfig {
	treasuryAddress: string;
	treasuryReward: {
		tokenID: string;
		offset: number;
		distance: number;
		mintBracket: string[];
		blockRewardTaxBracket: string[];
	};
}
