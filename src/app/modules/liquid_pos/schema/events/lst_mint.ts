export const liquidStakingTokenMintEventSchema = {
	$id: '/liquidPos/events/lst_mint',
	type: 'object',
	required: ['address', 'tokenID', 'amount'],
	properties: {
		address: {
			dataType: 'bytes',
			format: 'klayr32',
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
