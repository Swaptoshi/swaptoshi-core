export interface StakeTransactionParams {
	stakes: StakeObject[];
}

export interface StakeObject {
	validatorAddress: Buffer;
	amount: bigint;
}
