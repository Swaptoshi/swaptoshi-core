export const icoChangePriceCommandSchema = {
	$id: '/tokenFactory/command/icoChangePrice',
	type: 'object',
	properties: {
		poolAddress: {
			dataType: 'bytes',
			fieldNumber: 1,
		},
		price: {
			dataType: 'string',
			fieldNumber: 3,
		},
	},
};
