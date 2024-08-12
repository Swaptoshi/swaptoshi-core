/* eslint-disable import/no-cycle */
import { cryptography } from 'klayr-sdk';
import { DexModuleConfig } from '../types';
import { DEFAULT_TREASURY_ADDRESS } from './address';
import { DEX_DEFAULT_NAME, DEX_DEFAULT_TOKEN_DECIMAL, DEX_DEFAULT_TOKEN_SYMBOL, MAINCHAIN_DEFAULT_TOKEN_DECIMAL, MAINCHAIN_DEFAULT_TOKEN_SYMBOL } from './token_symbol';

export const defaultConfig: DexModuleConfig = {
	feeAmountTickSpacing: [
		{
			fee: '100',
			tickSpacing: '1',
		},
		{
			fee: '500',
			tickSpacing: '10',
		},
		{
			fee: '3000',
			tickSpacing: '60',
		},
		{
			fee: '10000',
			tickSpacing: '200',
		},
	],
	feeProtocol: 0,
	feeProtocolPool: cryptography.address.getKlayr32AddressFromAddress(DEFAULT_TREASURY_ADDRESS),
	feeConversionEnabled: true,
	supportAllTokens: true,
	minTransactionFee: {
		createPool: '0',
		mint: '0',
		burn: '0',
		collect: '0',
		increaseLiquidity: '0',
		decreaseLiquidity: '0',
		exactInput: '0',
		exactInputSingle: '0',
		exactOutput: '0',
		exactOutputSingle: '0',
		treasurify: '0',
	},
	baseFee: {
		createPool: '0',
		mint: '0',
		burn: '0',
		collect: '0',
		increaseLiquidity: '0',
		decreaseLiquidity: '0',
		exactInput: '0',
		exactInputSingle: '0',
		exactOutput: '0',
		exactOutputSingle: '0',
		treasurify: '0',
	},
	nftPositionMetadata: {
		dex: {
			name: DEX_DEFAULT_NAME,
			symbol: DEX_DEFAULT_TOKEN_SYMBOL,
			decimal: DEX_DEFAULT_TOKEN_DECIMAL,
		},
		mainchain: {
			symbol: MAINCHAIN_DEFAULT_TOKEN_SYMBOL,
			decimal: MAINCHAIN_DEFAULT_TOKEN_DECIMAL,
		},
	},
	nftPositionColorRange: {
		hue: [0, 360],
		saturation: [70, 100],
		lightness: [50, 60],
	},
};
