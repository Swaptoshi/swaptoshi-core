export const treasurifyEventSchema = {
	$id: '/dex/events/treasurify',
	type: 'object',
	required: ['poolAddress', 'treasuryAddress', 'token', 'amount'],
	properties: {
		poolAddress: {
			dataType: 'bytes',
			format: 'klayr32',
			fieldNumber: 1,
		},
		treasuryAddress: {
			dataType: 'bytes',
			format: 'klayr32',
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
