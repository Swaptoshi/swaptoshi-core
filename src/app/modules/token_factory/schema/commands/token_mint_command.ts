export const tokenMintCommandSchema = {
	$id: '/tokenFactory/command/tokenMint',
	type: 'object',
	properties: {
		tokenId: {
			dataType: 'bytes',
			fieldNumber: 1,
		},
		distribution: {
			type: 'array',
			fieldNumber: 2,
			items: {
				type: 'object',
				properties: {
					recipientAddress: {
						dataType: 'bytes',
						fieldNumber: 1,
					},
					amount: {
						dataType: 'uint64',
						fieldNumber: 2,
					},
					vesting: {
						type: 'array',
						fieldNumber: 3,
						items: {
							type: 'object',
							properties: {
								height: {
									dataType: 'uint32',
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
			},
		},
	},
};
