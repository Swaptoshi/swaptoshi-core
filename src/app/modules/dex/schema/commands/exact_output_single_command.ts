export const exactOutputSingleCommandSchema = {
	$id: '/dex/command/exact_output_single',
	type: 'object',
	properties: {
		tokenIn: {
			dataType: 'bytes',
			format: 'hex',
			fieldNumber: 1,
		},
		tokenOut: {
			dataType: 'bytes',
			format: 'hex',
			fieldNumber: 2,
		},
		fee: {
			dataType: 'string',
			fieldNumber: 3,
		},
		recipient: {
			dataType: 'bytes',
			format: 'klayr32',
			fieldNumber: 4,
		},
		deadline: {
			dataType: 'string',
			fieldNumber: 5,
		},
		amountOut: {
			dataType: 'string',
			fieldNumber: 6,
		},
		amountInMaximum: {
			dataType: 'string',
			fieldNumber: 7,
		},
		sqrtPriceLimitX96: {
			dataType: 'string',
			fieldNumber: 8,
		},
	},
};
