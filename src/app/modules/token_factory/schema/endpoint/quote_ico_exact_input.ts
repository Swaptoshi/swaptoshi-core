export const quoteICOExactInputEndpointResponseSchema = {
	$id: '/tokenFactory/endpoint/response/quoteICOExactInput',
	type: 'object',
	required: ['amountOut'],
	properties: {
		amountOut: {
			dataType: 'string',
			fieldNumber: 1,
		},
	},
};

export const quoteICOExactInputEndpointRequestSchema = {
	$id: '/tokenFactory/endpoint/request/quoteICOExactInput',
	type: 'object',
	required: ['path', 'tokenOut', 'amountIn'],
	properties: {
		path: {
			dataType: 'string',
			fieldNumber: 1,
		},
		tokenOut: {
			dataType: 'string',
			fieldNumber: 2,
		},
		amountIn: {
			dataType: 'string',
			fieldNumber: 3,
		},
	},
};
