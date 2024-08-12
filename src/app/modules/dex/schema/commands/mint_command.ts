export const mintCommandSchema = {
	$id: '/dex/command/mint',
	type: 'object',
	properties: {
		token0: {
			dataType: 'bytes',
			format: 'hex',
			fieldNumber: 1,
		},
		token1: {
			dataType: 'bytes',
			format: 'hex',
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
		amount0Desired: {
			dataType: 'string',
			fieldNumber: 6,
		},
		amount1Desired: {
			dataType: 'string',
			fieldNumber: 7,
		},
		amount0Min: {
			dataType: 'string',
			fieldNumber: 8,
		},
		amount1Min: {
			dataType: 'string',
			fieldNumber: 9,
		},
		recipient: {
			dataType: 'bytes',
			format: 'klayr32',
			fieldNumber: 10,
		},
		deadline: {
			dataType: 'string',
			fieldNumber: 11,
		},
	},
};
