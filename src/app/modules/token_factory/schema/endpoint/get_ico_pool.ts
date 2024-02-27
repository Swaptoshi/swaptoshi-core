export const getICOPoolEndpointResponseSchema = {
	$id: '/tokenFactory/endpoint/response/getICOPool',
	type: 'object',
	required: ['providerAddress', 'price', 'poolAddress', 'lisk32'],
	properties: {
		providerAddress: {
			dataType: 'string',
			fieldNumber: 1,
		},
		price: {
			dataType: 'string',
			fieldNumber: 2,
		},
		poolAddress: {
			dataType: 'string',
			fieldNumber: 3,
		},
		lisk32: {
			dataType: 'string',
			fieldNumber: 4,
		},
	},
};

export const getICOPoolEndpointRequestSchema = {
	$id: '/tokenFactory/endpoint/request/getICOPool',
	type: 'object',
	required: ['tokenIn', 'tokenOut'],
	properties: {
		tokenIn: {
			dataType: 'string',
			fieldNumber: 1,
		},
		tokenOut: {
			dataType: 'string',
			fieldNumber: 2,
		},
	},
};
