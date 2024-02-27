export const icoSwapEventSchema = {
	$id: '/tokenFactory/events/icoSwap',
	type: 'object',
	required: ['poolAddress', 'amountIn', 'amountOut'],
	properties: {
		poolAddress: {
			dataType: 'bytes',
			fieldNumber: 1,
		},
		amountIn: {
			dataType: 'uint64',
			fieldNumber: 2,
		},
		amountOut: {
			dataType: 'uint64',
			fieldNumber: 3,
		},
	},
};
