export const treasurifyCommandSchema = {
	$id: '/dex/command/treasurify',
	type: 'object',
	properties: {
		address: {
			dataType: 'bytes',
			fieldNumber: 1,
		},
		token: {
			dataType: 'bytes',
			fieldNumber: 2,
		},
	},
};
