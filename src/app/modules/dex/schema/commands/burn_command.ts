export const burnCommandSchema = {
	$id: '/dex/command/burn',
	type: 'object',
	properties: {
		poolAddress: {
			dataType: 'bytes',
			format: 'klayr32',
			fieldNumber: 1,
		},
		tokenId: {
			dataType: 'string',
			fieldNumber: 2,
		},
	},
};
