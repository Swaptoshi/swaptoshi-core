import { Types } from 'klayr-sdk';
import { chainID, moduleConfig } from '../stores/shared/module';
import { DexModuleConfig } from '../../../../../src/app/modules/dex/types';

export const moduleInitArgs: { genesisConfig: Types.GenesisConfig; moduleConfig: DexModuleConfig } = {
	genesisConfig: {
		chainID: chainID.toString('hex'),
	} as Types.GenesisConfig,
	moduleConfig,
};
