export const createPoolCommandSchema = {
	$id: '/dex/command/create_pool',
	type: 'object',
	properties: {
		tokenA: {
			dataType: 'bytes',
			fieldNumber: 1,
		},
		tokenASymbol: {
			dataType: 'string',
			fieldNumber: 2,
		},
		tokenADecimal: {
			dataType: 'uint32',
			fieldNumber: 3,
		},
		tokenB: {
			dataType: 'bytes',
			fieldNumber: 4,
		},
		tokenBSymbol: {
			dataType: 'string',
			fieldNumber: 5,
		},
		tokenBDecimal: {
			dataType: 'uint32',
			fieldNumber: 6,
		},
		fee: {
			dataType: 'string',
			fieldNumber: 7,
		},
		sqrtPriceX96: {
			dataType: 'string',
			fieldNumber: 8,
		},
	},
};
