export interface NFTMetadata {
	name: string;
	description: string;
	image: string;
}

export const getMetadataEndpointResponseSchema = {
	$id: '/dex/endpoint/response/get_metadata',
	type: 'object',
	required: ['name', 'description', 'image'],
	properties: {
		name: {
			dataType: 'string',
			fieldNumber: 1,
		},
		description: {
			dataType: 'string',
			fieldNumber: 2,
		},
		image: {
			dataType: 'string',
			fieldNumber: 3,
		},
	},
};

export const getMetadataEndpointRequestSchema = {
	$id: '/dex/endpoint/request/get_metadata',
	type: 'object',
	required: ['poolAddress', 'tokenId'],
	properties: {
		poolAddress: {
			dataType: 'string',
			fieldNumber: 1,
		},
		tokenId: {
			dataType: 'string',
			fieldNumber: 2,
		},
	},
};
