export const tickInfoStoreSchema = {
	$id: '/dex/store/tick_info',
	type: 'object',
	required: ['liquidityGross', 'liquidityNet', 'feeGrowthOutside0X128', 'feeGrowthOutside1X128', 'tickCumulativeOutside', 'secondsPerLiquidityOutsideX128', 'secondsOutside', 'initialized'],
	properties: {
		liquidityGross: {
			dataType: 'string',
			fieldNumber: 1,
		},
		liquidityNet: {
			dataType: 'string',
			fieldNumber: 2,
		},
		feeGrowthOutside0X128: {
			dataType: 'string',
			fieldNumber: 3,
		},
		feeGrowthOutside1X128: {
			dataType: 'string',
			fieldNumber: 4,
		},
		tickCumulativeOutside: {
			dataType: 'string',
			fieldNumber: 5,
		},
		secondsPerLiquidityOutsideX128: {
			dataType: 'string',
			fieldNumber: 6,
		},
		secondsOutside: {
			dataType: 'string',
			fieldNumber: 7,
		},
		initialized: {
			dataType: 'boolean',
			fieldNumber: 8,
		},
	},
};
