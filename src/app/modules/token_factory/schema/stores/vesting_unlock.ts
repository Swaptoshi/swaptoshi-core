export const vestingUnlockStoreSchema = {
	$id: '/tokenFactory/store/vestingUnlock',
	type: 'object',
	required: ['toBeUnlocked'],
	properties: {
		toBeUnlocked: {
			type: 'array',
			fieldNumber: 1,
			items: {
				type: 'object',
				properties: {
					tokenId: {
						dataType: 'bytes',
						fieldNumber: 1,
					},
					address: {
						dataType: 'bytes',
						format: 'klayr32',
						fieldNumber: 2,
					},
					amount: {
						dataType: 'uint64',
						fieldNumber: 3,
					},
				},
			},
		},
	},
};
