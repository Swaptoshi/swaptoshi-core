export const getNextIdEndpointResponseSchema = {
	$id: '/tokenFactory/endpoint/response/get_next_id',
	type: 'object',
	required: ['nextTokenId'],
	properties: {
		nextTokenId: {
			dataType: 'string',
			fieldNumber: 1,
		},
	},
};

export const getNextIdEndpointRequestSchema = {
	$id: '/tokenFactory/endpoint/request/get_next_id',
	type: 'object',
	required: [],
	properties: {},
};
