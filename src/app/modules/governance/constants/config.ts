import { cryptography } from 'klayr-sdk';
import { GovernanceModuleConfig } from '../types';
import { DEFAULT_TREASURY_ADDRESS } from './address';

export const defaultConfig: GovernanceModuleConfig = {
	treasuryAddress: cryptography.address.getKlayr32AddressFromAddress(DEFAULT_TREASURY_ADDRESS),
	treasuryReward: {
		tokenID: '',
		offset: 1,
		distance: 1,
		blockRewardTaxBracket: [],
		mintBracket: [],
	},
};
