export const exactInputCommandSchema = {
	$id: '/dex/command/exact_input',
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
		amountIn: {
			dataType: 'string',
			fieldNumber: 4,
		},
		amountOutMinimum: {
			dataType: 'string',
			fieldNumber: 5,
		},
	},
};
