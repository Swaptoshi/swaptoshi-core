export const collectEventSchema = {
	$id: '/dex/events/collect',
	type: 'object',
	required: ['senderAddress', 'recipientAddress', 'tickLower', 'tickUpper', 'amount0', 'amount1'],
	properties: {
		senderAddress: {
			dataType: 'bytes',
			fieldNumber: 1,
		},
		recipientAddress: {
			dataType: 'bytes',
			fieldNumber: 2,
		},
		tickLower: {
			dataType: 'string',
			fieldNumber: 3,
		},
		tickUpper: {
			dataType: 'string',
			fieldNumber: 4,
		},
		amount0: {
			dataType: 'string',
			fieldNumber: 5,
		},
		amount1: {
			dataType: 'string',
			fieldNumber: 6,
		},
	},
};
