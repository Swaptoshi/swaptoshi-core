export const getPoolEndpointResponseSchema = {
	$id: '/dex/endpoint/response/get_pool',
	type: 'object',
	required: [
		'token0',
		'token1',
		'fee',
		'tickSpacing',
		'maxLiquidityPerTick',
		'sqrtPriceX96',
		'tick',
		'feeGrowthGlobal0X128',
		'feeGrowthGlobal1X128',
		'liquidity',
		'slot0',
		'address',
		'klayr32',
		'collectionId',
	],
	properties: {
		token0: {
			dataType: 'string',
			fieldNumber: 1,
		},
		token1: {
			dataType: 'string',
			fieldNumber: 2,
		},
		fee: {
			dataType: 'string',
			fieldNumber: 3,
		},
		tickSpacing: {
			dataType: 'string',
			fieldNumber: 4,
		},
		maxLiquidityPerTick: {
			dataType: 'string',
			fieldNumber: 5,
		},
		sqrtPriceX96: {
			dataType: 'string',
			fieldNumber: 6,
		},
		tick: {
			dataType: 'string',
			fieldNumber: 7,
		},
		feeGrowthGlobal0X128: {
			dataType: 'string',
			fieldNumber: 8,
		},
		feeGrowthGlobal1X128: {
			dataType: 'string',
			fieldNumber: 9,
		},
		liquidity: {
			dataType: 'string',
			fieldNumber: 10,
		},
		slot0: {
			type: 'object',
			fieldNumber: 11,
			required: [
				'sqrtPriceX96',
				'tick',
				'observationIndex',
				'observationCardinality',
				'observationCardinalityNext',
			],
			properties: {
				sqrtPriceX96: {
					dataType: 'string',
					fieldNumber: 1,
				},
				tick: {
					dataType: 'string',
					fieldNumber: 2,
				},
				observationIndex: {
					dataType: 'string',
					fieldNumber: 3,
				},
				observationCardinality: {
					dataType: 'string',
					fieldNumber: 4,
				},
				observationCardinalityNext: {
					dataType: 'string',
					fieldNumber: 5,
				},
			},
		},
		address: {
			dataType: 'string',
			fieldNumber: 12,
		},
		klayr32: {
			dataType: 'string',
			fieldNumber: 13,
		},
		collectionId: {
			dataType: 'string',
			fieldNumber: 14,
		},
	},
};

export const getPoolEndpointRequestSchema = {
	$id: '/dex/endpoint/request/get_pool',
	type: 'object',
	required: ['tokenA', 'tokenB', 'fee'],
	properties: {
		tokenA: {
			dataType: 'string',
			fieldNumber: 1,
		},
		tokenB: {
			dataType: 'string',
			fieldNumber: 2,
		},
		fee: {
			dataType: 'string',
			fieldNumber: 3,
		},
	},
};
