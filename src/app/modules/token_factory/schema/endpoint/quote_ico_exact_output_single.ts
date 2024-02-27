export const quoteICOExactOutputSingleEndpointResponseSchema = {
	$id: '/tokenFactory/endpoint/response/quoteICOExactOutputSingle',
	type: 'object',
	required: ['amountIn'],
	properties: {
		amountIn: {
			dataType: 'string',
			fieldNumber: 1,
		},
	},
};

export const quoteICOExactOutputSingleEndpointRequestSchema = {
	$id: '/tokenFactory/endpoint/request/quoteICOExactOutputSingle',
	type: 'object',
	required: ['tokenIn', 'tokenOut', 'amountOut'],
	properties: {
		tokenIn: {
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
