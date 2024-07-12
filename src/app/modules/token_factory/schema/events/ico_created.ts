export const icoCreatedEventSchema = {
	$id: '/tokenFactory/events/icoCreated',
	type: 'object',
	required: ['tokenIn', 'tokenOut', 'price', 'providerAddress'],
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
		providerAddress: {
			dataType: 'bytes',
			format: 'klayr32',
			fieldNumber: 4,
		},
	},
};
