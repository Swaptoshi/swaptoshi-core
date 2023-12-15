export const exactInputSingleCommandSchema = {
	$id: '/dex/command/exact_input_single',
	type: 'object',
	properties: {
		tokenIn: {
			dataType: 'bytes',
			fieldNumber: 1,
		},
		tokenOut: {
			dataType: 'bytes',
			fieldNumber: 2,
		},
		fee: {
			dataType: 'string',
			fieldNumber: 3,
		},
		recipient: {
			dataType: 'bytes',
			fieldNumber: 4,
		},
		deadline: {
			dataType: 'string',
			fieldNumber: 5,
		},
		amountIn: {
			dataType: 'string',
			fieldNumber: 6,
		},
		amountOutMinimum: {
			dataType: 'string',
			fieldNumber: 7,
		},
		sqrtPriceLimitX96: {
			dataType: 'string',
			fieldNumber: 8,
		},
	},
};
