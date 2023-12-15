export const getPositionEndpointResponseSchema = {
	$id: '/dex/endpoint/response/get_position',
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
		'value',
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
		value: {
			type: 'object',
			fieldNumber: 11,
			properties: {
				principal0: {
					dataType: 'string',
					fieldNumber: 1,
				},
				principal1: {
					dataType: 'string',
					fieldNumber: 2,
				},
				fees0: {
					dataType: 'string',
					fieldNumber: 3,
				},
				fees1: {
					dataType: 'string',
					fieldNumber: 4,
				},
			},
		},
	},
};

export const getPositionEndpointRequestSchema = {
	$id: '/dex/endpoint/request/get_position',
	type: 'object',
	required: ['poolAddress', 'tokenId'],
	properties: {
		poolAddress: {
			dataType: 'string',
			fieldNumber: 1,
		},
		tokenId: {
			dataType: 'string',
			fieldNumber: 2,
		},
	},
};
