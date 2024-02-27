export const icoExactInputSingleCommandSchema = {
	$id: '/tokenFactory/command/icoExactInputSingle',
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
		amountIn: {
			dataType: 'uint64',
			fieldNumber: 3,
		},
	},
};
