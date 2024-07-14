export const factoryStoreSchema = {
	$id: '/tokenFactory/store/factory',
	type: 'object',
	required: ['owner', 'attributesArray'],
	properties: {
		owner: {
			dataType: 'bytes',
			format: 'klayr32',
			fieldNumber: 1,
		},
		attributesArray: {
			type: 'array',
			fieldNumber: 2,
			items: {
				type: 'object',
				required: ['key', 'attributes'],
				properties: {
					key: {
						dataType: 'string',
						fieldNumber: 1,
					},
					attributes: {
						dataType: 'bytes',
						fieldNumber: 2,
					},
				},
			},
		},
	},
};
