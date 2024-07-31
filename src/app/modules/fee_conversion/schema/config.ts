export const configSchema = {
	$id: '/fee_conversion/config',
	type: 'object',
	required: ['conversionPath'],
	properties: {
		conversionPath: {
			type: 'array',
			fieldNumber: 1,
			items: {
				dataType: 'string',
			},
		},
	},
};
