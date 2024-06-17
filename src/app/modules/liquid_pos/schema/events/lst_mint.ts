export const liquidStakingTokenMintEventSchema = {
	$id: '/liquid_pos/events/lst_mint',
	type: 'object',
	required: ['address', 'tokenID', 'amount'],
	properties: {
		address: {
			dataType: 'bytes',
			fieldNumber: 1,
		},
		tokenID: {
			dataType: 'bytes',
			fieldNumber: 2,
		},
		amount: {
			dataType: 'uint64',
			fieldNumber: 3,
		},
	},
};
