export const quotePriceEndpointResponseSchema = {
	$id: '/dex/endpoint/response/quote_price',
	type: 'object',
	required: ['price', 'pair'],
	properties: {
		price: {
			dataType: 'uint32',
			fieldNumber: 1,
		},
		pair: {
			dataType: 'string',
			fieldNumber: 2,
		},
	},
};

export const quotePriceEndpointRequestSchema = {
	$id: '/dex/endpoint/request/quote_price',
	type: 'object',
	required: ['path'],
	properties: {
		path: {
			dataType: 'string',
			format: 'hex',
			fieldNumber: 1,
		},
	},
};
