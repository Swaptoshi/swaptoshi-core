const LENGTH_NFT_ID = 16;
const MAX_LENGTH_DATA = 64;
const MIN_LENGTH_MODULE_NAME = 1;
const MAX_LENGTH_MODULE_NAME = 32;

export const nftTransferParamsSchema = {
	$id: '/lisk/nftTransferParams',
	type: 'object',
	required: ['nftID', 'recipientAddress', 'data'],
	properties: {
		nftID: {
			dataType: 'bytes',
			minLength: LENGTH_NFT_ID,
			maxLength: LENGTH_NFT_ID,
			fieldNumber: 1,
		},
		recipientAddress: {
			dataType: 'bytes',
			format: 'klayr32',
			fieldNumber: 2,
		},
		data: {
			dataType: 'string',
			minLength: 0,
			maxLength: MAX_LENGTH_DATA,
			fieldNumber: 3,
		},
	},
};

export const crossChainNFTTransferMessageParamsSchema = {
	$id: '/lisk/crossChainNFTTransferMessageParamsSchmema',
	type: 'object',
	required: ['nftID', 'senderAddress', 'recipientAddress', 'attributesArray', 'data'],
	properties: {
		nftID: {
			dataType: 'bytes',
			minLength: LENGTH_NFT_ID,
			maxLength: LENGTH_NFT_ID,
			fieldNumber: 1,
		},
		senderAddress: {
			dataType: 'bytes',
			format: 'klayr32',
			fieldNumber: 2,
		},
		recipientAddress: {
			dataType: 'bytes',
			format: 'klayr32',
			fieldNumber: 3,
		},
		attributesArray: {
			type: 'array',
			fieldNumber: 4,
			items: {
				type: 'object',
				required: ['module', 'attributes'],
				properties: {
					module: {
						dataType: 'string',
						minLength: MIN_LENGTH_MODULE_NAME,
						maxLength: MAX_LENGTH_MODULE_NAME,
						pattern: '^[a-zA-Z0-9]*$',
						fieldNumber: 1,
					},
					attributes: {
						dataType: 'bytes',
						fieldNumber: 2,
					},
				},
			},
		},
		data: {
			dataType: 'string',
			maxLength: MAX_LENGTH_DATA,
			fieldNumber: 5,
		},
	},
};
