export const airdropEditRecipientsCommandSchema = {
	$id: '/tokenFactory/command/airdropEditRecipients',
	type: 'object',
	properties: {
		tokenId: {
			dataType: 'bytes',
			fieldNumber: 1,
		},
		recipients: {
			type: 'array',
			fieldNumber: 2,
			items: {
				type: 'object',
				properties: {
					address: {
						dataType: 'bytes',
						format: 'klayr32',
						fieldNumber: 1,
					},
					amountDelta: {
						dataType: 'sint64',
						fieldNumber: 2,
					},
				},
			},
		},
	},
};
