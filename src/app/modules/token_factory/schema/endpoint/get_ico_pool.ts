export const getICOPoolEndpointResponseSchema = {
	$id: '/tokenFactory/endpoint/response/getICOPool',
	type: 'object',
	required: ['providerAddress', 'price', 'poolAddress', 'klayr32'],
	properties: {
		providerAddress: {
			dataType: 'string',
			format: 'klayr32',
			fieldNumber: 1,
		},
		price: {
			dataType: 'string',
			fieldNumber: 2,
		},
		poolAddress: {
			dataType: 'string',
			format: 'klayr32',
			fieldNumber: 3,
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
