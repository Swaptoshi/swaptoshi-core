export const exactOutputCommandSchema = {
	$id: '/dex/command/exact_output',
	type: 'object',
	properties: {
		path: {
			dataType: 'bytes',
			format: 'hex',
			fieldNumber: 1,
		},
		recipient: {
			dataType: 'bytes',
			format: 'klayr32',
			fieldNumber: 2,
		},
		deadline: {
			dataType: 'string',
			fieldNumber: 3,
		},
		amountOut: {
			dataType: 'string',
			fieldNumber: 4,
		},
		amountInMaximum: {
			dataType: 'string',
			fieldNumber: 5,
		},
	},
};
