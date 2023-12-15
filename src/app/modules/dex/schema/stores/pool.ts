export const poolStoreSchema = {
	$id: '/dex/store/pool',
	type: 'object',
	required: [
		'token0',
		'token1',
		'fee',
		'tickSpacing',
		'maxLiquidityPerTick',
		'feeGrowthGlobal0X128',
		'feeGrowthGlobal1X128',
		'liquidity',
		'slot0',
	],
	properties: {
		token0: {
			dataType: 'bytes',
			fieldNumber: 1,
		},
		token1: {
			dataType: 'bytes',
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
		feeGrowthGlobal0X128: {
			dataType: 'string',
			fieldNumber: 6,
		},
		feeGrowthGlobal1X128: {
			dataType: 'string',
			fieldNumber: 7,
		},
		liquidity: {
			dataType: 'string',
			fieldNumber: 8,
		},
		slot0: {
			type: 'object',
			fieldNumber: 9,
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
	},
};
