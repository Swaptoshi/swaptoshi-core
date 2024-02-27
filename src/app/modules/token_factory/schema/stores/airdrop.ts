export const airdropStoreSchema = {
	$id: '/tokenFactory/store/airdrop',
	type: 'object',
	required: ['recipients'],
	properties: {
		recipients: {
			type: 'array',
			fieldNumber: 1,
			items: {
				type: 'object',
				properties: {
					address: {
						dataType: 'bytes',
						fieldNumber: 1,
					},
					amount: {
						dataType: 'uint64',
						fieldNumber: 2,
					},
				},
			},
		},
	},
};
