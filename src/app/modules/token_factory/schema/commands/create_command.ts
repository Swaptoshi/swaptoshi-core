export const createTokenCommandSchema = {
	$id: '/tokenFactory/command/create',
	type: 'object',
	properties: {
		amount: {
			dataType: 'uint64',
			fieldNumber: 1,
		},
	},
};
