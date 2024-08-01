export interface TokenFactoryModuleConfig {
	skippedTokenID: string[];
	icoLeftOverAddress: string;
	icoFeeConversionEnabled: boolean;
	icoDexPathEnabled: boolean;
	minTransactionFee: {
		factoryTransferOwnership: string;
		factorySetAttributes: string;
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
		factorySetAttributes: string;
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
