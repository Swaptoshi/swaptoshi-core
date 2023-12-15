export const treasurifyEventSchema = {
	$id: '/dex/events/treasurify',
	type: 'object',
	required: ['poolAddress', 'treasuryAddress', 'token', 'amount'],
	properties: {
		poolAddress: {
			dataType: 'bytes',
			fieldNumber: 1,
		},
		treasuryAddress: {
			dataType: 'bytes',
			fieldNumber: 2,
		},
		token: {
			dataType: 'bytes',
			fieldNumber: 3,
		},
		amount: {
			dataType: 'string',
			fieldNumber: 4,
		},
	},
};
