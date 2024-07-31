/* eslint-disable import/no-cycle */
import { TypedSchema } from '../../governance';
import { FeeConversionModuleConfig } from '../types';

export const configSchema: TypedSchema<FeeConversionModuleConfig> = {
	$id: '/fee_conversion/config',
	type: 'object',
	required: ['conversionPath'],
	properties: {
		conversionPath: {
			type: 'array',
			fieldNumber: 1,
			items: {
				dataType: 'string',
			},
		},
	},
};
