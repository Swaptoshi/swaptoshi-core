export const nextTokenIdStoreSchema = {
	$id: '/tokenFactory/store/nextTokenId',
	type: 'object',
	required: ['nextTokenId'],
	properties: {
		nextTokenId: {
			dataType: 'uint64',
			fieldNumber: 1,
		},
	},
};
