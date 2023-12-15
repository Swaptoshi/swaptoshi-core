export const collectCommandSchema = {
	$id: '/dex/command/collect',
	type: 'object',
	properties: {
		poolAddress: {
			dataType: 'bytes',
			fieldNumber: 1,
		},
		tokenId: {
			dataType: 'string',
			fieldNumber: 2,
		},
		recipient: {
			dataType: 'bytes',
			fieldNumber: 3,
		},
		amount0Max: {
			dataType: 'string',
			fieldNumber: 4,
		},
		amount1Max: {
			dataType: 'string',
			fieldNumber: 5,
		},
	},
};
