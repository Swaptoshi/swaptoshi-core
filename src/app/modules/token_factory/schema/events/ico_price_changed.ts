export const icoPriceChangedEventSchema = {
	$id: '/tokenFactory/events/icoPriceChanged',
	type: 'object',
	required: ['poolAddress', 'price'],
	properties: {
		poolAddress: {
			dataType: 'bytes',
			fieldNumber: 1,
		},
		price: {
			dataType: 'string',
			fieldNumber: 2,
		},
	},
};
