export const icoWithdrawEventSchema = {
	$id: '/tokenFactory/events/icoWithdraw',
	type: 'object',
	required: ['poolAddress', 'amount'],
	properties: {
		poolAddress: {
			dataType: 'bytes',
			format: 'klayr32',
			fieldNumber: 1,
		},
		amount: {
			dataType: 'uint64',
			fieldNumber: 2,
		},
	},
};
