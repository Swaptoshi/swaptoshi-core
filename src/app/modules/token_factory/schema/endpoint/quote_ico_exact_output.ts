export const quoteICOExactOutputEndpointResponseSchema = {
	$id: '/tokenFactory/endpoint/response/quoteICOExactOutput',
	type: 'object',
	required: ['amountIn'],
	properties: {
		amountIn: {
			dataType: 'string',
			fieldNumber: 1,
		},
	},
};

export const quoteICOExactOutputEndpointRequestSchema = {
	$id: '/tokenFactory/endpoint/request/quoteICOExactOutput',
	type: 'object',
	required: ['path', 'tokenOut', 'amountOut'],
	properties: {
		path: {
			dataType: 'string',
			fieldNumber: 1,
		},
		tokenOut: {
			dataType: 'string',
			fieldNumber: 2,
		},
		amountOut: {
			dataType: 'string',
			fieldNumber: 3,
		},
	},
};
