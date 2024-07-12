export const airdropDistributedEventSchema = {
	$id: '/tokenFactory/events/airdropDistributed',
	type: 'object',
	required: ['tokenId', 'senderAddress', 'recipientAddress', 'amount'],
	properties: {
		tokenId: {
			dataType: 'bytes',
			fieldNumber: 1,
		},
		senderAddress: {
			dataType: 'bytes',
			format: 'klayr32',
			fieldNumber: 2,
		},
		recipientAddress: {
			dataType: 'bytes',
			format: 'klayr32',
			fieldNumber: 3,
		},
		amount: {
			dataType: 'uint64',
			fieldNumber: 4,
		},
	},
};
