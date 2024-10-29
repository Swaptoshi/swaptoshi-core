export const getLSTTokenIDEndpointResponseSchema = {
	$id: '/liquidPos/endpoint/response/get_lst_token_id',
	type: 'object',
	required: ['tokenID'],
	properties: {
		tokenID: {
			dataType: 'string',
			fieldNumber: 1,
		},
	},
};

export const getLSTTokenIDEndpointRequestSchema = {
	$id: '/liquidPos/endpoint/request/get_lst_token_id',
	type: 'object',
	required: [],
	properties: {},
};
