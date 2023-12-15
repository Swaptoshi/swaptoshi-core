export const supportedTokenStoreSchema = {
	$id: '/dex/store/supported_token',
	type: 'object',
	required: ['supportAll', 'supported'],
	properties: {
		supportAll: {
			dataType: 'boolean',
			fieldNumber: 1,
		},
		supported: {
			type: 'array',
			fieldNumber: 2,
			items: {
				dataType: 'bytes',
			},
		},
	},
};
