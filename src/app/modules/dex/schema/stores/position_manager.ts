export const positionManagerStoreSchema = {
	$id: '/dex/store/position_manager',
	type: 'object',
	required: ['poolAddress', 'name', 'symbol'],
	properties: {
		poolAddress: {
			dataType: 'bytes',
			fieldNumber: 1,
		},
		name: {
			dataType: 'string',
			fieldNumber: 2,
		},
		symbol: {
			dataType: 'string',
			fieldNumber: 3,
		},
	},
};
