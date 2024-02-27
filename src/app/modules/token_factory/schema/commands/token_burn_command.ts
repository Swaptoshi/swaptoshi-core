export const tokenBurnCommandSchema = {
	$id: '/tokenFactory/command/tokenBurn',
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
