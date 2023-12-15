export const tokenUriCreatedEventSchema = {
	$id: '/dex/events/tokenuri_created',
	type: 'object',
	required: ['tokenURI', 'tokenId'],
	properties: {
		tokenURI: {
			dataType: 'string',
			fieldNumber: 1,
		},
		tokenId: {
			dataType: 'bytes',
			fieldNumber: 2,
		},
	},
};
