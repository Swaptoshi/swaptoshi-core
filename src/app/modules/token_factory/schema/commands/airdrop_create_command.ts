export const airdropCreateCommandSchema = {
	$id: '/tokenFactory/command/airdropCreate',
	type: 'object',
	properties: {
		tokenId: {
			dataType: 'bytes',
			fieldNumber: 1,
		},
		providerAddress: {
			dataType: 'bytes',
			format: 'klayr32',
			fieldNumber: 2,
		},
		recipients: {
			type: 'array',
			fieldNumber: 3,
			items: {
				type: 'object',
				properties: {
					address: {
						dataType: 'bytes',
						format: 'klayr32',
						fieldNumber: 1,
					},
					amountDelta: {
						dataType: 'sint64',
						fieldNumber: 2,
					},
				},
			},
		},
	},
};
