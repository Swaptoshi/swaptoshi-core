export const tokenUriNFTAttributeSchema = {
	$id: '/dex/attribute/nft/token_uri',
	type: 'object',
	required: ['tokenURI'],
	properties: {
		tokenURI: {
			dataType: 'string',
			fieldNumber: 1,
		},
	},
};
