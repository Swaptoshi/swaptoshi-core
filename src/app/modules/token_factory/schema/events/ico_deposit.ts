export const icoDepositEventSchema = {
	$id: '/tokenFactory/events/icoDeposit',
	type: 'object',
	required: ['poolAddress', 'amount'],
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