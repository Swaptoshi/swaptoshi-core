export const dexNFTAttributeSchema = {
	$id: '/dex/attribute/nft',
	type: 'object',
	required: [
		'token0',
		'token1',
		'fee',
		'tickLower',
		'tickUpper',
		'liquidity',
		'feeGrowthInside0LastX128',
		'feeGrowthInside1LastX128',
		'tokensOwed0',
		'tokensOwed1',
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
		tickLower: {
			dataType: 'string',
			fieldNumber: 4,
		},
		tickUpper: {
			dataType: 'string',
			fieldNumber: 5,
		},
		liquidity: {
			dataType: 'string',
			fieldNumber: 6,
		},
		feeGrowthInside0LastX128: {
			dataType: 'string',
			fieldNumber: 7,
		},
		feeGrowthInside1LastX128: {
			dataType: 'string',
			fieldNumber: 8,
		},
		tokensOwed0: {
			dataType: 'string',
			fieldNumber: 9,
		},
		tokensOwed1: {
			dataType: 'string',
			fieldNumber: 10,
		},
	},
};
