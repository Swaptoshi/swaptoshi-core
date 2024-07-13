export const getConfigEndpointResponseSchema = {
	$id: '/liquid_pos/endpoint/response/get_config',
	type: 'object',
	required: ['tokenID', 'ratio'],
	properties: {
		tokenID: {
			dataType: 'uint32',
			fieldNumber: 1,
		},
		ratio: {
			dataType: 'uint32',
			fieldNumber: 2,
		},
	},
};

export const getConfigEndpointRequestSchema = {
	$id: '/liquid_pos/endpoint/request/get_config',
	type: 'object',
	required: [],
	properties: {},
};
