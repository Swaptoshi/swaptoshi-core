export const getRegisteredHandlersEndpointResponseSchema = {
	$id: '/fee_conversion/endpoint/response/get_registered_handlers',
	type: 'object',
	required: ['handlers'],
	properties: {
		handlers: {
			type: 'array',
			fieldNumber: 1,
			items: {
				type: 'object',
				required: ['module', 'method'],
				properties: {
					module: {
						fieldNumber: 1,
						dataType: 'string',
					},
					method: {
						type: 'array',
						fieldNumber: 2,
						items: {
							dataType: 'string',
						},
					},
				},
			},
		},
	},
};

export const getRegisteredHandlersEndpointRequestSchema = {
	$id: '/fee_conversion/endpoint/request/get_registered_handlers',
	type: 'object',
	required: [],
	properties: {},
};
