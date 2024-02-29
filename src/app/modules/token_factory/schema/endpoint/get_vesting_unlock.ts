export const getVestingUnlockEndpointResponseSchema = {
	$id: '/tokenFactory/endpoint/response/getVestingUnlock',
	type: 'object',
	required: ['toBeUnlocked'],
	properties: {
		toBeUnlocked: {
			type: 'array',
			fieldNumber: 1,
			items: {
				type: 'object',
				properties: {
					tokenId: {
						dataType: 'bytes',
						fieldNumber: 1,
					},
					address: {
						dataType: 'bytes',
						fieldNumber: 2,
					},
					amount: {
						dataType: 'uint64',
						fieldNumber: 3,
					},
				},
			},
		},
	},
};

export const getVestingUnlockEndpointRequestSchema = {
	$id: '/tokenFactory/endpoint/request/getVestingUnlock',
	type: 'object',
	required: ['height'],
	properties: {
		height: {
			dataType: 'uint32',
			fieldNumber: 1,
		},
	},
};