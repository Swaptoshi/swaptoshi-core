/* eslint-disable import/no-cycle */
import { GovernableConfigSchema } from '../../governance';
import { FeeConversionModuleConfig } from '../types';

export const configSchema: GovernableConfigSchema<FeeConversionModuleConfig> = {
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
