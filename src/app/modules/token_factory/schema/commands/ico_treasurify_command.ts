export const icoTreasurifyCommandSchema = {
	$id: '/tokenFactory/command/icoTreasurify',
	type: 'object',
	properties: {
		poolAddress: {
			dataType: 'bytes',
			fieldNumber: 1,
		},
		tokenId: {
			dataType: 'bytes',
			fieldNumber: 2,
		},
	},
};
