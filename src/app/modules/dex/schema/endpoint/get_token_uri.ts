import { tokenUriNFTAttributeSchema } from '../nft_attribute/tokenuri_nft_attribute';

export const getTokenURIEndpointResponseSchema = {
	...tokenUriNFTAttributeSchema,
	$id: '/dex/endpoint/response/get_token_uri',
};

export const getTokenURIEndpointRequestSchema = {
	$id: '/dex/endpoint/request/get_token_uri',
	type: 'object',
	required: ['poolAddress', 'tokenId'],
	properties: {
		poolAddress: {
			dataType: 'bytes',
			format: 'klayr32',
			fieldNumber: 1,
		},
		tokenId: {
			dataType: 'string',
			fieldNumber: 2,
		},
	},
};
