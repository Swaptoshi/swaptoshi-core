export const feeConvertedEventSchema = {
	$id: '/fee_conversion/events/fee_converted',
	type: 'object',
	required: ['moduleCommand', 'poolAddress', 'token', 'amount'],
	properties: {
		moduleCommand: {
			dataType: 'string',
			fieldNumber: 1,
		},
		poolAddress: {
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