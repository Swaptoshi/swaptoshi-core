export const icoExactOutputSingleCommandSchema = {
	$id: '/tokenFactory/command/icoExactOutputSingle',
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
		amountOut: {
			dataType: 'uint64',
			fieldNumber: 3,
		},
		recipient: {
			dataType: 'bytes',
			fieldNumber: 4,
		},
	},
};
