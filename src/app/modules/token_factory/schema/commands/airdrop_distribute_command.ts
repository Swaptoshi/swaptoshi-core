export const airdropDistributeCommandSchema = {
	$id: '/tokenFactory/command/airdropDistribute',
	type: 'object',
	properties: {
		tokenId: {
			dataType: 'bytes',
			fieldNumber: 1,
		},
	},
};
