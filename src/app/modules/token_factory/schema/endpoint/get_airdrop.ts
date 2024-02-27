export const getAirdropEndpointResponseSchema = {
	$id: '/tokenFactory/endpoint/response/getAirdrop',
	type: 'object',
	required: ['recipients'],
	properties: {
		recipients: {
			type: 'array',
			fieldNumber: 1,
			items: {
				type: 'object',
				properties: {
					address: {
						dataType: 'bytes',
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
};

export const getAirdropEndpointRequestSchema = {
	$id: '/tokenFactory/endpoint/request/getAirdrop',
	type: 'object',
	required: ['tokenId', 'providerAddress'],
	properties: {
		tokenId: {
			dataType: 'string',
			fieldNumber: 1,
		},
		providerAddress: {
			dataType: 'string',
			fieldNumber: 2,
		},
	},
};
