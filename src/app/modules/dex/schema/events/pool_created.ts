export const poolCreatedEventSchema = {
	$id: '/dex/events/pool_created',
	type: 'object',
	required: ['token0', 'token1', 'fee', 'tickSpacing', 'poolAddress'],
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
		poolAddress: {
			dataType: 'bytes',
			format: 'klayr32',
			fieldNumber: 5,
		},
	},
};
