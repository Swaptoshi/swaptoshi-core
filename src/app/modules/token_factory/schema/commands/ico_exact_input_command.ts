export const icoExactInputCommandSchema = {
	$id: '/tokenFactory/command/icoExactInput',
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
		amountIn: {
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
		amountOutMinimum: {
			dataType: 'uint64',
			fieldNumber: 6,
		},
	},
};
