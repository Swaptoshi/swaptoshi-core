export const icoChangePriceCommandSchema = {
	$id: '/tokenFactory/command/icoChangePrice',
	type: 'object',
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
