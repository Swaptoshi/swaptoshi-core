export const factorySetAttributesEventSchema = {
	$id: '/tokenFactory/events/setAttributes',
	type: 'object',
	required: ['tokenId', 'key', 'attributes'],
	properties: {
		tokenId: {
			dataType: 'bytes',
			fieldNumber: 1,
		},
		key: {
			dataType: 'string',
			fieldNumber: 2,
		},
		attributes: {
			dataType: 'bytes',
			fieldNumber: 3,
		},
	},
};
