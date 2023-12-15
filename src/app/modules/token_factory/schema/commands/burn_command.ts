export const burnTokenCommandSchema = {
	$id: '/tokenFactory/command/burn',
	type: 'object',
	properties: {
		tokenId: {
			dataType: 'bytes',
			fieldNumber: 1,
		},
		amount: {
			dataType: 'uint64',
			fieldNumber: 2,
		},
	},
};
