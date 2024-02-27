export const getFactoryEndpointResponseSchema = {
	$id: '/tokenFactory/endpoint/response/getFactory',
	type: 'object',
	required: ['owner'],
	properties: {
		owner: {
			dataType: 'string',
			fieldNumber: 1,
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
