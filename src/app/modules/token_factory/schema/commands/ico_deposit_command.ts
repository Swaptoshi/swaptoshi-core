export const icoDepositCommandSchema = {
	$id: '/tokenFactory/command/icoDeposit',
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
