export const tokenUriDestroyedEventSchema = {
	$id: '/dex/events/tokenuri_destroyed',
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
