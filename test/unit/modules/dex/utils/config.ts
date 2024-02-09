import { GenesisConfig } from 'lisk-sdk';
import { chainID, moduleConfig } from '../stores/shared/module';
import { DexModuleConfig } from '../../../../../src/app/modules/dex/types';

export const moduleInitArgs: { genesisConfig: GenesisConfig; moduleConfig: DexModuleConfig } = {
	genesisConfig: {
		chainID: chainID.toString('hex'),
	} as GenesisConfig,
	moduleConfig,
};
