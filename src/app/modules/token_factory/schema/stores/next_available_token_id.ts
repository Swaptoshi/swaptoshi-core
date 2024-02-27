export const nextAvailableTokenIdStoreSchema = {
	$id: '/tokenFactory/store/nextAvailableTokenId',
	type: 'object',
	required: ['nextTokenId'],
	properties: {
		nextTokenId: {
			dataType: 'uint64',
			fieldNumber: 1,
		},
	},
};
