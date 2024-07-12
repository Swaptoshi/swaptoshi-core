export const icoTreasurifyEventSchema = {
	$id: '/tokenFactory/events/icoTreasurify',
	type: 'object',
	required: ['poolAddress', 'leftOverAddress', 'token', 'amount'],
	properties: {
		poolAddress: {
			dataType: 'bytes',
			format: 'klayr32',
			fieldNumber: 1,
		},
		leftOverAddress: {
			dataType: 'bytes',
			format: 'klayr32',
			fieldNumber: 2,
		},
		token: {
			dataType: 'bytes',
			fieldNumber: 3,
		},
		amount: {
			dataType: 'uint64',
			fieldNumber: 4,
		},
	},
};
