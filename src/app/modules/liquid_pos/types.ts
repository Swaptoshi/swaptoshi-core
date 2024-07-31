import { TokenMethod } from 'klayr-sdk';
import { GovernanceMethod } from '../governance';

export interface LiquidPosModuleConfig {
	tokenID: string;
	ratio: number;
}

export interface StakeTransactionParams {
	stakes: StakeObject[];
}

export interface StakeObject {
	validatorAddress: Buffer;
	amount: bigint;
}

export interface LiquidPosModuleDependencies {
	tokenMethod: TokenMethod;
	governanceMethod?: GovernanceMethod;
}
