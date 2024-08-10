export const stakeCommandParamsSchema = {
	$id: '/pos/command/stakeValidatorParams',
	type: 'object',
	required: ['stakes'],
	properties: {
		stakes: {
			type: 'array',
			fieldNumber: 1,
			minItems: 1,
			maxItems: 20,
			items: {
				type: 'object',
				required: ['validatorAddress', 'amount'],
				properties: {
					validatorAddress: {
						dataType: 'bytes',
						fieldNumber: 1,
						format: 'klayr32',
					},
					amount: {
						dataType: 'sint64',
						fieldNumber: 2,
					},
				},
			},
		},
	},
};
