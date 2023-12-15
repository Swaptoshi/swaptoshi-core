export const factoryStoreSchema = {
	$id: '/tokenFactory/store/factory',
	type: 'object',
	required: ['owner'],
	properties: {
		owner: {
			dataType: 'bytes',
			fieldNumber: 1,
		},
	},
};
