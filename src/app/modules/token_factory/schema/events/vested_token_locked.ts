export const vestedTokenLockedEventSchema = {
	$id: '/tokenFactory/events/vestedTokenLocked',
	type: 'object',
	required: ['recipientAddress', 'tokenId', 'height', 'amount'],
	properties: {
		recipientAddress: {
			dataType: 'bytes',
			format: 'klayr32',
			fieldNumber: 1,
		},
		tokenId: {
			dataType: 'bytes',
			fieldNumber: 2,
		},
		height: {
			dataType: 'uint32',
			fieldNumber: 3,
		},
		amount: {
			dataType: 'uint64',
			fieldNumber: 4,
		},
	},
};
