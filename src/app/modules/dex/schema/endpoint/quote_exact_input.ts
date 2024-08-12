export const quoteExactInputEndpointResponseSchema = {
	$id: '/dex/endpoint/response/quote_exact_input',
	type: 'object',
	required: ['amountOut', 'sqrtPriceX96AfterList', 'initializedTicksCrossedList'],
	properties: {
		amountOut: {
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

export const quoteExactInputEndpointRequestSchema = {
	$id: '/dex/endpoint/request/quote_exact_input',
	type: 'object',
	required: ['path', 'amountIn'],
	properties: {
		path: {
			dataType: 'string',
			format: 'hex',
			fieldNumber: 1,
		},
		amountIn: {
			dataType: 'string',
			fieldNumber: 2,
		},
	},
};
