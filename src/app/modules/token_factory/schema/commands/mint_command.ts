export const mintTokenCommandSchema = {
	$id: '/tokenFactory/command/mint',
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
