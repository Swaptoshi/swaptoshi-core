import { cryptography } from 'lisk-sdk';
import { DexModuleConfig } from '../types';
import { DEFAULT_TREASURY_ADDRESS } from './address';

export const defaultConfig: DexModuleConfig = {
	feeAmountTickSpacing: [
		['500', '10'],
		['3000', '60'],
		['10000', '200'],
	],
	feeProtocol: 0,
	feeProtocolPool: cryptography.address.getLisk32AddressFromAddress(DEFAULT_TREASURY_ADDRESS),
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
};
