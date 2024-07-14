export const factorySetAttributesCommandSchema = {
	$id: '/tokenFactory/command/factorySetAttributes',
	type: 'object',
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
