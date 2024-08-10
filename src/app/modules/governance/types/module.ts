import { FeeMethod, TokenMethod } from 'klayr-sdk';

export interface GovernanceModuleDependencies {
	tokenMethod: TokenMethod;
	feeMethod: FeeMethod;
}
