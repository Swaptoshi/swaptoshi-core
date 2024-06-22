import { DexModuleConfig } from '../../types';
import { verifyBoolean, verifyKlayer32Address, verifyNumber, verifyNumberString, verifyString } from './base';

// eslint-disable-next-line @typescript-eslint/require-await
export async function verifyModuleConfig(config: DexModuleConfig) {
	if (config.feeAmountTickSpacing.length > 0) {
		for (const feeAmountTickSpacings of config.feeAmountTickSpacing) {
			verifyNumberString('config.feeAmountTickSpacing', feeAmountTickSpacings[0]);
			verifyNumberString('config.feeAmountTickSpacing', feeAmountTickSpacings[1]);
		}
	}

	verifyNumber('config.feeProtocol', config.feeProtocol);

	if (config.feeProtocolPool) {
		verifyKlayer32Address('config.feeProtocolPool', config.feeProtocolPool);
	}

	verifyBoolean('config.feeConversionEnabled', config.feeConversionEnabled);
	verifyBoolean('config.supportAllTokens', config.supportAllTokens);

	for (const commands of Object.keys(config.minTransactionFee)) {
		verifyNumberString(`config.minTransactionFee.${commands}`, config.minTransactionFee[commands as keyof DexModuleConfig['minTransactionFee']]);
	}

	for (const commands of Object.keys(config.baseFee)) {
		verifyNumberString(`config.baseFee.${commands}`, config.baseFee[commands as keyof DexModuleConfig['baseFee']]);
	}

	verifyString('config.nftPositionMetadata.dex.name', config.nftPositionMetadata.dex.name);
	verifyString('config.nftPositionMetadata.dex.symbol', config.nftPositionMetadata.dex.symbol);
	verifyNumber('config.nftPositionMetadata.dex.decimal', config.nftPositionMetadata.dex.decimal);
	verifyString('config.nftPositionMetadata.mainchain.symbol', config.nftPositionMetadata.mainchain.symbol);
	verifyNumber('config.nftPositionMetadata.mainchain.decimal', config.nftPositionMetadata.mainchain.decimal);

	verifyNumber('config.nftPositionColorRange.hue[0]', config.nftPositionColorRange.hue[0]);
	verifyNumber('config.nftPositionColorRange.hue[1]', config.nftPositionColorRange.hue[1]);

	if (config.nftPositionColorRange.hue[0] < 0 || config.nftPositionColorRange.hue[0] > 360) throw new Error('config.nftPositionColorRange.hue needs to be between 0 and 360');
	if (config.nftPositionColorRange.hue[0] > config.nftPositionColorRange.hue[1]) throw new Error("config.nftPositionColorRange.hue at index 0 can't be higher than index 1");

	verifyNumber('config.nftPositionColorRange.saturation[0]', config.nftPositionColorRange.saturation[0]);
	verifyNumber('config.nftPositionColorRange.saturation[1]', config.nftPositionColorRange.saturation[1]);

	if (config.nftPositionColorRange.saturation[0] < 0 || config.nftPositionColorRange.saturation[0] > 100) throw new Error('config.nftPositionColorRange.saturation needs to be between 0 and 100');
	if (config.nftPositionColorRange.saturation[0] > config.nftPositionColorRange.saturation[1]) throw new Error("config.nftPositionColorRange.saturation at index 0 can't be higher than index 1");

	verifyNumber('config.nftPositionColorRange.lightness[0]', config.nftPositionColorRange.lightness[0]);
	verifyNumber('config.nftPositionColorRange.lightness[1]', config.nftPositionColorRange.lightness[1]);

	if (config.nftPositionColorRange.lightness[0] < 0 || config.nftPositionColorRange.lightness[0] > 100) throw new Error('config.nftPositionColorRange.lightness needs to be between 0 and 100');
	if (config.nftPositionColorRange.lightness[0] > config.nftPositionColorRange.lightness[1]) throw new Error("config.nftPositionColorRange.lightness at index 0 can't be higher than index 1");
}
