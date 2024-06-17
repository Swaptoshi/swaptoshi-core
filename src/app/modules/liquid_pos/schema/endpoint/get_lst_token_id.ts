export const getLSTTokenIDEndpointResponseSchema = {
	$id: '/liquid_pos/endpoint/response/get_lst_token_id',
	type: 'object',
	required: ['tokenID'],
	properties: {
		tokenID: {
			dataType: 'bytes',
			fieldNumber: 1,
		},
	},
};

export const getLSTTokenIDEndpointRequestSchema = {
	$id: '/liquid_pos/endpoint/request/get_lst_token_id',
	type: 'object',
	required: [],
	properties: {},
};
