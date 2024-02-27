export const icoWithdrawCommandSchema = {
	$id: '/tokenFactory/command/icoWithdraw',
	type: 'object',
	properties: {
		poolAddress: {
			dataType: 'bytes',
			fieldNumber: 1,
		},
		amount: {
			dataType: 'uint64',
			fieldNumber: 2,
		},
	},
};
