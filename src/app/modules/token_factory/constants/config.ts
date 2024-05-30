import { cryptography } from 'klayr-sdk';
import { TokenFactoryModuleConfig } from '../types';
import { DEFAULT_LEFTOVER_ADDRESS } from './address';

export const defaultConfig: TokenFactoryModuleConfig = {
	icoLeftOverAddress: cryptography.address.getKlayr32AddressFromAddress(DEFAULT_LEFTOVER_ADDRESS),
	icoFeeConversionEnabled: true,
	minTransactionFee: {
		airdropCreate: '0',
		airdropDistribute: '0',
		airdropEditRecipients: '0',
		factoryTransferOwnership: '0',
		icoCreate: '0',
		icoChangePrice: '0',
		icoDeposit: '0',
		icoExactInput: '0',
		icoExactInputSingle: '0',
		icoExactOutput: '0',
		icoExactOutputSingle: '0',
		icoTreasurify: '0',
		icoWithdraw: '0',
		tokenBurn: '0',
		tokenCreate: '0',
		tokenMint: '0',
	},
	baseFee: {
		airdropCreate: '0',
		airdropDistribute: '0',
		airdropEditRecipients: '0',
		factoryTransferOwnership: '0',
		icoCreate: '0',
		icoChangePrice: '0',
		icoDeposit: '0',
		icoExactInput: '0',
		icoExactInputSingle: '0',
		icoExactOutput: '0',
		icoExactOutputSingle: '0',
		icoTreasurify: '0',
		icoWithdraw: '0',
		tokenBurn: '0',
		tokenCreate: '0',
		tokenMint: '0',
	},
};
