export const getRegisteredGovernableConfigEndpointResponseSchema = {
	$id: '/governance/endpoint/response/getRegisteredGovernableConfig',
	type: 'object',
	required: ['modules'],
	properties: {
		modules: {
			type: 'array',
			fieldNumber: 1,
			items: {
				dataType: 'string',
			},
		},
	},
};

export const getRegisteredGovernableConfigEndpointRequestSchema = {
	$id: '/governance/endpoint/request/getRegisteredGovernableConfig',
	type: 'object',
	required: [],
	properties: {},
};
