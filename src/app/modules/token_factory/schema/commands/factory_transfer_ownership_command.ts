export const factoryTransferOwnershipCommandSchema = {
	$id: '/tokenFactory/command/factoryTransferOwnership',
	type: 'object',
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
