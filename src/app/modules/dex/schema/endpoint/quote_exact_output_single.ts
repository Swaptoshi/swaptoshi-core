export const quoteExactOutputSingleEndpointResponseSchema = {
	$id: '/dex/endpoint/response/quote_exact_output_single',
	type: 'object',
	required: ['amountOut', 'sqrtPriceX96After', 'initializedTicksCrossed'],
	properties: {
		amountOut: {
			dataType: 'string',
			fieldNumber: 1,
		},
		sqrtPriceX96After: {
			dataType: 'string',
			fieldNumber: 2,
		},
		initializedTicksCrossed: {
			dataType: 'string',
			fieldNumber: 3,
		},
	},
};

export const quoteExactOutputSingleEndpointRequestSchema = {
	$id: '/dex/endpoint/requeste/quote_exact_output_single',
	type: 'object',
	required: ['tokenIn', 'tokenOut', 'amount', 'fee', 'sqrtPriceLimitX96'],
	properties: {
		tokenIn: {
			dataType: 'string',
			fieldNumber: 1,
		},
		tokenOut: {
			dataType: 'string',
			fieldNumber: 2,
		},
		amount: {
			dataType: 'string',
			fieldNumber: 3,
		},
		fee: {
			dataType: 'string',
			fieldNumber: 4,
		},
		sqrtPriceLimitX96: {
			dataType: 'string',
			fieldNumber: 5,
		},
	},
};
