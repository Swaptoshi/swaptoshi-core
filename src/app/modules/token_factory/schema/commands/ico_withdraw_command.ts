export const icoWithdrawCommandSchema = {
	$id: '/tokenFactory/command/icoWithdraw',
	type: 'object',
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
