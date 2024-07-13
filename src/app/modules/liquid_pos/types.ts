export interface LiquidPosModuleConfig {
	tokenID: string | number;
	ratio: number;
}

export interface StakeTransactionParams {
	stakes: StakeObject[];
}

export interface StakeObject {
	validatorAddress: Buffer;
	amount: bigint;
}
