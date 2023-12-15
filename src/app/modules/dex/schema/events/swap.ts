export const swapEventSchema = {
	$id: '/dex/events/swap',
	type: 'object',
	required: [
		'senderAddress',
		'recipientAddress',
		'amount0',
		'amount1',
		'sqrtPriceX96Before',
		'sqrtPriceX96',
		'liquidityBefore',
		'liquidity',
		'tickBefore',
		'tick',
		'feeGrowthGlobal0X128Before',
		'feeGrowthGlobal0X128',
		'feeGrowthGlobal1X128Before',
		'feeGrowthGlobal1X128',
	],
	properties: {
		senderAddress: {
			dataType: 'bytes',
			fieldNumber: 1,
		},
		recipientAddress: {
			dataType: 'bytes',
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
		sqrtPriceX96Before: {
			dataType: 'string',
			fieldNumber: 5,
		},
		sqrtPriceX96: {
			dataType: 'string',
			fieldNumber: 6,
		},
		liquidityBefore: {
			dataType: 'string',
			fieldNumber: 7,
		},
		liquidity: {
			dataType: 'string',
			fieldNumber: 8,
		},
		tickBefore: {
			dataType: 'string',
			fieldNumber: 9,
		},
		tick: {
			dataType: 'string',
			fieldNumber: 10,
		},
		feeGrowthGlobal0X128Before: {
			dataType: 'string',
			fieldNumber: 11,
		},
		feeGrowthGlobal1X128Before: {
			dataType: 'string',
			fieldNumber: 12,
		},
		feeGrowthGlobal0X128: {
			dataType: 'string',
			fieldNumber: 13,
		},
		feeGrowthGlobal1X128: {
			dataType: 'string',
			fieldNumber: 14,
		},
	},
};
