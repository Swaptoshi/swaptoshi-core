export const tokenCreateCommandSchema = {
	$id: '/tokenFactory/command/tokenCreate',
	type: 'object',
	properties: {
		distribution: {
			type: 'array',
			fieldNumber: 1,
			items: {
				type: 'object',
				properties: {
					recipientAddress: {
						dataType: 'bytes',
						format: 'klayr32',
						fieldNumber: 1,
					},
					amount: {
						dataType: 'uint64',
						fieldNumber: 2,
					},
					vesting: {
						type: 'array',
						fieldNumber: 3,
						items: {
							type: 'object',
							properties: {
								height: {
									dataType: 'uint32',
									fieldNumber: 1,
								},
								amount: {
									dataType: 'uint64',
									fieldNumber: 2,
								},
							},
						},
					},
				},
			},
		},
		attributes: {
			type: 'array',
			fieldNumber: 2,
			items: {
				type: 'object',
				required: ['key', 'attributes'],
				properties: {
					key: {
						dataType: 'string',
						fieldNumber: 1,
					},
					attributes: {
						dataType: 'bytes',
						fieldNumber: 2,
					},
				},
			},
		},
	},
};
