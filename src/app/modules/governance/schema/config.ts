export const configSchema = {
	$id: '/governance/config',
	type: 'object',
	required: ['treasuryAddress', 'treasuryReward'],
	properties: {
		treasuryAddress: {
			type: 'string',
		},
		treasuryReward: {
			type: 'object',
			required: ['tokenID', 'offset', 'distance', 'mintBracket', 'blockRewardTaxBracket'],
			properties: {
				tokenID: {
					type: 'string',
					format: 'hex',
					minLength: 16,
					maxLength: 16,
				},
				offset: {
					type: 'integer',
					minimum: 1,
				},
				distance: {
					type: 'integer',
					minimum: 1,
				},
				mintBracket: {
					type: 'array',
					items: {
						type: 'string',
					},
				},
				blockRewardTaxBracket: {
					type: 'array',
					items: {
						type: 'string',
					},
				},
			},
		},
	},
};
