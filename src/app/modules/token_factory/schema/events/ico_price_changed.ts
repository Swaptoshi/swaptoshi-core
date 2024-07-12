export const icoPriceChangedEventSchema = {
	$id: '/tokenFactory/events/icoPriceChanged',
	type: 'object',
	required: ['poolAddress', 'price'],
	properties: {
		poolAddress: {
			dataType: 'bytes',
			format: 'klayr32',
			fieldNumber: 1,
		},
		price: {
			dataType: 'string',
			fieldNumber: 2,
		},
	},
};
