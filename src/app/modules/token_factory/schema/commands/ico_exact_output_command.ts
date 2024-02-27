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
		deadline: {
			dataType: 'uint32',
			fieldNumber: 4,
		},
		amountInMaximum: {
			dataType: 'uint64',
			fieldNumber: 5,
		},
	},
};
