export const flashEventSchema = {
	$id: '/dex/events/flash',
	type: 'object',
	required: ['senderAddress', 'recipientAddress', 'amount0', 'amount1', 'paid0', 'paid1'],
	properties: {
		senderAddress: {
			dataType: 'bytes',
			format: 'klayr32',
			fieldNumber: 1,
		},
		recipientAddress: {
			dataType: 'bytes',
			format: 'klayr32',
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
		paid0: {
			dataType: 'string',
			fieldNumber: 5,
		},
		paid1: {
			dataType: 'string',
			fieldNumber: 6,
		},
	},
};
