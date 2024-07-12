export const burnEventSchema = {
	$id: '/dex/events/burn',
	type: 'object',
	required: ['senderAddress', 'tickLower', 'tickUpper', 'lowerLiquidityNetBefore', 'lowerLiquidityNet', 'upperLiquidityNetBefore', 'upperLiquidityNet'],
	properties: {
		senderAddress: {
			dataType: 'bytes',
			format: 'klayr32',
			fieldNumber: 1,
		},
		tickLower: {
			dataType: 'string',
			fieldNumber: 2,
		},
		tickUpper: {
			dataType: 'string',
			fieldNumber: 3,
		},
		lowerLiquidityNetBefore: {
			dataType: 'string',
			fieldNumber: 4,
		},
		lowerLiquidityNet: {
			dataType: 'string',
			fieldNumber: 5,
		},
		upperLiquidityNetBefore: {
			dataType: 'string',
			fieldNumber: 6,
		},
		upperLiquidityNet: {
			dataType: 'string',
			fieldNumber: 7,
		},
	},
};
