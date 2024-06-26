import { TokenFactoryModuleConfig } from '../types';
import { verifyBoolean, verifyKlayer32Address, verifyNumber, verifyNumberString, verifyPositiveNumber } from './verify';

// eslint-disable-next-line @typescript-eslint/require-await
export async function verifyModuleConfig(config: TokenFactoryModuleConfig) {
	for (const skippedTokenID of config.skippedTokenID) {
		verifyNumber('config.skippedTokenID', skippedTokenID);
		verifyPositiveNumber('config.skippedTokenID', skippedTokenID);
	}

	verifyKlayer32Address('config.icoLeftOverAddress', config.icoLeftOverAddress);

	verifyBoolean('config.icoFeeConversionEnabled', config.icoFeeConversionEnabled);

	verifyBoolean('config.icoDexPathEnabled', config.icoDexPathEnabled);

	for (const commands of Object.keys(config.minTransactionFee)) {
		verifyNumberString(`config.minTransactionFee.${commands}`, config.minTransactionFee[commands as keyof TokenFactoryModuleConfig['minTransactionFee']]);
		verifyPositiveNumber(`config.minTransactionFee.${commands}`, config.minTransactionFee[commands as keyof TokenFactoryModuleConfig['minTransactionFee']]);
	}

	for (const commands of Object.keys(config.baseFee)) {
		verifyNumberString(`config.baseFee.${commands}`, config.baseFee[commands as keyof TokenFactoryModuleConfig['baseFee']]);
		verifyPositiveNumber(`config.baseFee.${commands}`, config.baseFee[commands as keyof TokenFactoryModuleConfig['baseFee']]);
	}
}
