export const decreaseLiquidityCommandSchema = {
	$id: '/dex/command/decrease_liquidity',
	type: 'object',
	properties: {
		poolAddress: {
			dataType: 'bytes',
			format: 'klayr32',
			fieldNumber: 1,
		},
		tokenId: {
			dataType: 'string',
			fieldNumber: 2,
		},
		liquidity: {
			dataType: 'string',
			fieldNumber: 3,
		},
		amount0Min: {
			dataType: 'string',
			fieldNumber: 4,
		},
		amount1Min: {
			dataType: 'string',
			fieldNumber: 5,
		},
		deadline: {
			dataType: 'string',
			fieldNumber: 6,
		},
	},
};
