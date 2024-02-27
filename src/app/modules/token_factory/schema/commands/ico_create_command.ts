export const icoCreateCommandSchema = {
	$id: '/tokenFactory/command/icoCreate',
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
		price: {
			dataType: 'string',
			fieldNumber: 3,
		},
		amount: {
			dataType: 'uint64',
			fieldNumber: 4,
		},
		providerAddress: {
			dataType: 'bytes',
			fieldNumber: 5,
		},
	},
};
