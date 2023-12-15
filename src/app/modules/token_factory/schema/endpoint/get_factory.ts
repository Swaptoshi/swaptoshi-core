export const getFactoryEndpointResponseSchema = {
	$id: '/tokenFactory/endpoint/response/get_factory',
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
	$id: '/tokenFactory/endpoint/request/get_factory',
	type: 'object',
	required: ['tokenId'],
	properties: {
		tokenId: {
			dataType: 'string',
			fieldNumber: 1,
		},
	},
};
