export const airdropRecipientsChangedEventSchema = {
	$id: '/tokenFactory/events/airdropRecipientsChanged',
	type: 'object',
	required: ['tokenId', 'recipientAddress', 'amountDelta'],
	properties: {
		tokenId: {
			dataType: 'bytes',
			fieldNumber: 1,
		},
		recipientAddress: {
			dataType: 'bytes',
			fieldNumber: 2,
		},
		amountDelta: {
			dataType: 'sint64',
			fieldNumber: 3,
		},
	},
};
