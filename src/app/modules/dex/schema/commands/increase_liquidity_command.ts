export const increaseLiquidityCommandSchema = {
	$id: '/dex/command/increase_liquidity',
	type: 'object',
	properties: {
		poolAddress: {
			dataType: 'bytes',
			fieldNumber: 1,
		},
		tokenId: {
			dataType: 'string',
			fieldNumber: 2,
		},
		amount0Desired: {
			dataType: 'string',
			fieldNumber: 3,
		},
		amount1Desired: {
			dataType: 'string',
			fieldNumber: 4,
		},
		amount0Min: {
			dataType: 'string',
			fieldNumber: 5,
		},
		amount1Min: {
			dataType: 'string',
			fieldNumber: 6,
		},
		deadline: {
			dataType: 'string',
			fieldNumber: 7,
		},
	},
};
