export const poolInitializedEventSchema = {
	$id: '/dex/events/pool_initialized',
	type: 'object',
	required: ['sqrtPriceX96', 'tick'],
	properties: {
		sqrtPriceX96: {
			dataType: 'string',
			fieldNumber: 1,
		},
		tick: {
			dataType: 'string',
			fieldNumber: 2,
		},
	},
};
