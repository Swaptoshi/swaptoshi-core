export const icoTreasurifyCommandSchema = {
	$id: '/tokenFactory/command/icoTreasurify',
	type: 'object',
	properties: {
		poolAddress: {
			dataType: 'bytes',
			format: 'klayr32',
			fieldNumber: 1,
		},
		tokenId: {
			dataType: 'bytes',
			fieldNumber: 2,
		},
	},
};
