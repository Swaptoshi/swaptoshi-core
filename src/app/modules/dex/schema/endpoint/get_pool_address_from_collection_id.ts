export const getPoolAddressFromCollectionIdEndpointResponseSchema = {
	$id: '/dex/endpoint/response/get_pool_address_from_collection_id',
	type: 'object',
	required: ['poolAddress'],
	properties: {
		poolAddress: {
			dataType: 'string',
			format: 'klayr32',
			fieldNumber: 1,
		},
	},
};

export const getPoolAddressFromCollectionIdEndpointRequestSchema = {
	$id: '/dex/endpoint/request/get_pool_address_from_collection_id',
	type: 'object',
	required: ['collectionId'],
	properties: {
		collectionId: {
			dataType: 'string',
			format: 'hex',
			fieldNumber: 1,
		},
	},
};
