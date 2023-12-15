export interface DexModuleConfig {
	feeAmountTickSpacing: [string, string][];
	feeProtocol: number;
	feeProtocolPool: string;
	feeConversionEnabled: boolean;
	supportAllTokens: boolean;
	minTransactionFee: {
		createPool: string;
		mint: string;
		burn: string;
		collect: string;
		increaseLiquidity: string;
		decreaseLiquidity: string;
		exactInput: string;
		exactInputSingle: string;
		exactOutput: string;
		exactOutputSingle: string;
		treasurify: string;
	};
}
