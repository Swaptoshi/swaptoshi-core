import { GovernanceModuleConfig, TypedSchema } from '../types';

export const configSchema: TypedSchema<GovernanceModuleConfig> = {
	$id: '/governance/config',
	type: 'object',
	required: ['treasuryAddress', 'treasuryReward'],
	properties: {
		treasuryAddress: {
			dataType: 'string',
			fieldNumber: 1,
		},
		treasuryReward: {
			type: 'object',
			fieldNumber: 2,
			required: ['tokenID', 'offset', 'distance', 'mintBracket', 'blockRewardTaxBracket'],
			properties: {
				tokenID: {
					dataType: 'string',
					fieldNumber: 1,
					format: 'hex',
					minLength: 16,
					maxLength: 16,
				},
				offset: {
					dataType: 'uint32',
					fieldNumber: 2,
					minimum: 1,
				},
				distance: {
					dataType: 'uint32',
					fieldNumber: 3,
					minimum: 1,
				},
				mintBracket: {
					type: 'array',
					fieldNumber: 4,
					items: {
						dataType: 'string',
					},
				},
				blockRewardTaxBracket: {
					type: 'array',
					fieldNumber: 5,
					items: {
						dataType: 'string',
					},
				},
			},
		},
	},
};
