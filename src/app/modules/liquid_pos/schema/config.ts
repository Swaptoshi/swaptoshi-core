import { GovernableConfigSchema } from '../../governance';
import { LiquidPosModuleConfig } from '../types';

export const configSchema: GovernableConfigSchema<LiquidPosModuleConfig> = {
	$id: '/liquid_pos/config',
	type: 'object',
	required: ['tokenID', 'ratio'],
	properties: {
		tokenID: {
			dataType: 'string',
			governable: false,
			fieldNumber: 1,
		},
		ratio: {
			dataType: 'uint32',
			governable: false,
			fieldNumber: 2,
		},
	},
};
