export interface TokenFactoryModuleConfig {
	icoLeftOverAddress: string;
	icoFeeConversionEnabled: boolean;
	minTransactionFee: {
		factoryTransferOwnership: string;
		tokenCreate: string;
		tokenMint: string;
		tokenBurn: string;
		icoCreate: string;
		icoChangePrice: string;
		icoTreasurify: string;
		icoDeposit: string;
		icoWithdraw: string;
		icoExactInput: string;
		icoExactInputSingle: string;
		icoExactOutput: string;
		icoExactOutputSingle: string;
		airdropCreate: string;
		airdropEditRecipients: string;
		airdropDistribute: string;
	};
	baseFee: {
		factoryTransferOwnership: string;
		tokenCreate: string;
		tokenMint: string;
		tokenBurn: string;
		icoCreate: string;
		icoChangePrice: string;
		icoTreasurify: string;
		icoDeposit: string;
		icoWithdraw: string;
		icoExactInput: string;
		icoExactInputSingle: string;
		icoExactOutput: string;
		icoExactOutputSingle: string;
		airdropCreate: string;
		airdropEditRecipients: string;
		airdropDistribute: string;
	};
}
