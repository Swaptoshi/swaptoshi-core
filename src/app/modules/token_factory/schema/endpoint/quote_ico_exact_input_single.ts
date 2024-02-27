export const quoteICOExactInputSingleEndpointResponseSchema = {
	$id: '/tokenFactory/endpoint/response/quoteICOExactInputSingle',
	type: 'object',
	required: ['amountOut'],
	properties: {
		amountOut: {
			dataType: 'string',
			fieldNumber: 1,
		},
	},
};

export const quoteICOExactInputSingleEndpointRequestSchema = {
	$id: '/tokenFactory/endpoint/request/quoteICOExactInputSingle',
	type: 'object',
	required: ['tokenIn', 'tokenOut', 'amountIn'],
	properties: {
		tokenIn: {
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
