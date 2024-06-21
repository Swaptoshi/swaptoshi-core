export const getConfigEndpointResponseSchema = {
	$id: '/fee_conversion/endpoint/response/get_config',
	type: 'object',
	required: ['conversionPath'],
	properties: {
		conversionPath: {
			type: 'array',
			fieldNumber: 1,
			items: {
				type: 'array',
				items: {
					dataType: 'string',
				},
			},
		},
	},
};

export const getConfigEndpointRequestSchema = {
	$id: '/fee_conversion/endpoint/request/get_config',
	type: 'object',
	required: [],
	properties: {},
};
