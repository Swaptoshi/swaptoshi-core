export const getFactoryEndpointResponseSchema = {
	$id: '/tokenFactory/endpoint/response/getFactory',
	type: 'object',
	required: ['owner', 'attributesArray'],
	properties: {
		owner: {
			dataType: 'string',
			fieldNumber: 1,
		},
		attributesArray: {
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
						dataType: 'string',
						fieldNumber: 2,
					},
				},
			},
		},
	},
};

export const getFactoryEndpointRequestSchema = {
	$id: '/tokenFactory/endpoint/request/getFactory',
	type: 'object',
	required: ['tokenId'],
	properties: {
		tokenId: {
			dataType: 'string',
			fieldNumber: 1,
		},
	},
};
