export const quoteExactOutputEndpointResponseSchema = {
	$id: '/dex/endpoint/response/quote_exact_output',
	type: 'object',
	required: ['amountIn', 'sqrtPriceX96AfterList', 'initializedTicksCrossedList'],
	properties: {
		amountIn: {
			dataType: 'string',
			fieldNumber: 1,
		},
		sqrtPriceX96AfterList: {
			type: 'array',
			fieldNumber: 2,
			items: {
				dataType: 'string',
			},
		},
		initializedTicksCrossedList: {
			type: 'array',
			fieldNumber: 3,
			items: {
				dataType: 'string',
			},
		},
	},
};

export const quoteExactOutputEndpointRequestSchema = {
	$id: '/dex/endpoint/request/quote_exact_output',
	type: 'object',
	required: ['path', 'amountOut'],
	properties: {
		path: {
			dataType: 'string',
			fieldNumber: 1,
		},
		amountOut: {
			dataType: 'string',
			fieldNumber: 2,
		},
	},
};
