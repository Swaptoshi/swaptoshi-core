export interface DexModuleConfig {
	feeAmountTickSpacing: { fee: string; tickSpacing: string }[];
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
	baseFee: {
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
	nftPositionMetadata: {
		dex: {
			name: string;
			symbol: string;
			decimal: number;
		};
		mainchain: {
			symbol: string;
			decimal: number;
		};
	};
	nftPositionColorRange: {
		hue: [number, number];
		saturation: [number, number];
		lightness: [number, number];
	};
}
