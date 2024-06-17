export const liquidStakingTokenBurnEventSchema = {
	$id: '/liquid_pos/events/lst_burn',
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
