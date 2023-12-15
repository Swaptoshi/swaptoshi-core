export const tickBitmapStoreSchema = {
	$id: '/dex/store/tick_bitmap',
	type: 'object',
	required: ['bitmap'],
	properties: {
		bitmap: {
			dataType: 'string',
			fieldNumber: 1,
		},
	},
};
