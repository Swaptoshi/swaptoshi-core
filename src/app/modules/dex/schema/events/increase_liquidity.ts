export const increaseLiquidityEventSchema = {
	$id: '/dex/events/increase_liquidity',
	type: 'object',
	required: ['tokenId', 'liquidity', 'amount0', 'amount1'],
	properties: {
		tokenId: {
			dataType: 'bytes',
			fieldNumber: 1,
		},
		liquidity: {
			dataType: 'string',
			fieldNumber: 2,
		},
		amount0: {
			dataType: 'string',
			fieldNumber: 3,
		},
		amount1: {
			dataType: 'string',
			fieldNumber: 4,
		},
		ownerAddress: {
			dataType: 'bytes',
			fieldNumber: 5,
		},
	},
};
