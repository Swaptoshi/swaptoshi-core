export const icoStoreSchema = {
	$id: '/tokenFactory/store/ico',
	type: 'object',
	required: ['providerAddress', 'price'],
	properties: {
		providerAddress: {
			dataType: 'bytes',
			fieldNumber: 1,
		},
		price: {
			dataType: 'string',
			fieldNumber: 2,
		},
	},
};
