export const factoryCreatedEventSchema = {
	$id: '/tokenFactory/events/factoryCreated',
	type: 'object',
	required: ['ownerAddress', 'tokenId', 'amount'],
	properties: {
		ownerAddress: {
			dataType: 'bytes',
			format: 'klayr32',
			fieldNumber: 1,
		},
		tokenId: {
			dataType: 'bytes',
			fieldNumber: 2,
		},
		amount: {
			dataType: 'uint64',
			fieldNumber: 3,
		},
	},
};
