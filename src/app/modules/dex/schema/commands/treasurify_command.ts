export const treasurifyCommandSchema = {
	$id: '/dex/command/treasurify',
	type: 'object',
	properties: {
		address: {
			dataType: 'bytes',
			format: 'klayr32',
			fieldNumber: 1,
		},
		token: {
			dataType: 'bytes',
			format: 'hex',
			fieldNumber: 2,
		},
	},
};
