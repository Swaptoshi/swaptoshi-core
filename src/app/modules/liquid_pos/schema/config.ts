import { TypedSchema } from '../../governance';
import { LiquidPosModuleConfig } from '../types';

export const configSchema: TypedSchema<LiquidPosModuleConfig> = {
	$id: '/liquid_pos/config',
	type: 'object',
	required: ['tokenID', 'ratio'],
	properties: {
		tokenID: {
			dataType: 'string',
			fieldNumber: 1,
		},
		ratio: {
			dataType: 'uint32',
			fieldNumber: 2,
		},
	},
};
