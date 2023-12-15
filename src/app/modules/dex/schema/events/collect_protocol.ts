export const collectProtocolEventSchema = {
	$id: '/dex/events/collect_protocol',
	type: 'object',
	required: ['senderAddress', 'recipientAddress', 'amount0', 'amount1'],
	properties: {
		senderAddress: {
			dataType: 'bytes',
			fieldNumber: 1,
		},
		recipientAddress: {
			dataType: 'bytes',
			fieldNumber: 2,
		},
		amount0: {
			dataType: 'string',
			fieldNumber: 3,
		},
		amount1: {
			dataType: 'string',
			fieldNumber: 4,
		},
	},
};
