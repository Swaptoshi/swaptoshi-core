export const getNextAvailableTokenIdEndpointResponseSchema = {
	$id: '/tokenFactory/endpoint/response/getNextAvailableTokenId',
	type: 'object',
	required: ['nextTokenId'],
	properties: {
		nextTokenId: {
			dataType: 'string',
			fieldNumber: 1,
		},
	},
};

export const getNextAvailableTokenIdEndpointRequestSchema = {
	$id: '/tokenFactory/endpoint/request/getNextAvailableTokenId',
	type: 'object',
	required: [],
	properties: {},
};
