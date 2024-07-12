export const mintEventSchema = {
	$id: '/dex/events/mint',
	type: 'object',
	required: ['senderAddress', 'recipientAddress', 'tickLower', 'tickUpper', 'lowerLiquidityNetBefore', 'lowerLiquidityNet', 'upperLiquidityNetBefore', 'upperLiquidityNet'],
	properties: {
		senderAddress: {
			dataType: 'bytes',
			format: 'klayr32',
			fieldNumber: 1,
		},
		recipientAddress: {
			dataType: 'bytes',
			format: 'klayr32',
			fieldNumber: 2,
		},
		tickLower: {
			dataType: 'string',
			fieldNumber: 3,
		},
		tickUpper: {
			dataType: 'string',
			fieldNumber: 4,
		},
		lowerLiquidityNetBefore: {
			dataType: 'string',
			fieldNumber: 5,
		},
		lowerLiquidityNet: {
			dataType: 'string',
			fieldNumber: 6,
		},
		upperLiquidityNetBefore: {
			dataType: 'string',
			fieldNumber: 7,
		},
		upperLiquidityNet: {
			dataType: 'string',
			fieldNumber: 8,
		},
	},
};
