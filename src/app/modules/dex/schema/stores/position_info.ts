export const positionInfoStoreSchema = {
	$id: '/dex/store/position_info',
	type: 'object',
	required: ['liquidity', 'feeGrowthInside0LastX128', 'feeGrowthInside1LastX128', 'tokensOwed0', 'tokensOwed1'],
	properties: {
		liquidity: {
			dataType: 'string',
			fieldNumber: 1,
		},
		feeGrowthInside0LastX128: {
			dataType: 'string',
			fieldNumber: 2,
		},
		feeGrowthInside1LastX128: {
			dataType: 'string',
			fieldNumber: 3,
		},
		tokensOwed0: {
			dataType: 'string',
			fieldNumber: 4,
		},
		tokensOwed1: {
			dataType: 'string',
			fieldNumber: 5,
		},
	},
};
