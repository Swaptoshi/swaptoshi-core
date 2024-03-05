export const icoExactOutputCommandSchema = {
	$id: '/tokenFactory/command/icoExactOutput',
	type: 'object',
	properties: {
		path: {
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
		deadline: {
			dataType: 'uint32',
			fieldNumber: 5,
		},
		pathAmountInMaximum: {
			dataType: 'uint64',
			fieldNumber: 6,
		},
	},
};
