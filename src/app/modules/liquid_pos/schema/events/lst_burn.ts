export const liquidStakingTokenBurnEventSchema = {
	$id: '/liquidPos/events/lst_burn',
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
