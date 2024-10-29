export const feeConvertedEventSchema = {
	$id: '/feeConversion/events/fee_converted',
	type: 'object',
	required: ['moduleCommand', 'path', 'token', 'amount'],
	properties: {
		moduleCommand: {
			dataType: 'string',
			fieldNumber: 1,
		},
		path: {
			dataType: 'bytes',
			fieldNumber: 2,
		},
		token: {
			dataType: 'bytes',
			fieldNumber: 3,
		},
		amount: {
			dataType: 'string',
			fieldNumber: 4,
		},
	},
};
