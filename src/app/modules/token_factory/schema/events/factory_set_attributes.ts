export const factorySetAttributesEventSchema = {
	$id: '/tokenFactory/events/setAttributes',
	type: 'object',
	required: ['tokenId', 'key'],
	properties: {
		tokenId: {
			dataType: 'bytes',
			fieldNumber: 1,
		},
		key: {
			dataType: 'string',
			fieldNumber: 2,
		},
	},
};
