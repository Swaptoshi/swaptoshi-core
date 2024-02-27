export const factoryOwnerChangedEventSchema = {
	$id: '/tokenFactory/events/factoryOwnerChanged',
	type: 'object',
	required: ['tokenId', 'ownerAddress'],
	properties: {
		tokenId: {
			dataType: 'bytes',
			fieldNumber: 1,
		},
		ownerAddress: {
			dataType: 'bytes',
			fieldNumber: 2,
		},
	},
};
