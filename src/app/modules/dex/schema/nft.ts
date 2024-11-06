const LENGTH_NFT_ID = 16;
const MIN_LENGTH_MODULE_NAME = 1;
const MAX_LENGTH_MODULE_NAME = 32;
const LENGTH_COLLECTION_ID = 4;

export const genesisNFTStoreSchema = {
	$id: '/nft/module/genesis',
	type: 'object',
	required: ['nftSubstore', 'supportedNFTsSubstore'],
	properties: {
		nftSubstore: {
			type: 'array',
			fieldNumber: 1,
			items: {
				type: 'object',
				required: ['nftID', 'owner', 'attributesArray'],
				properties: {
					nftID: {
						dataType: 'bytes',
						minLength: LENGTH_NFT_ID,
						maxLength: LENGTH_NFT_ID,
						fieldNumber: 1,
					},
					owner: {
						dataType: 'bytes',
						fieldNumber: 2,
					},
					attributesArray: {
						type: 'array',
						fieldNumber: 3,
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
				},
			},
		},
		supportedNFTsSubstore: {
			type: 'array',
			fieldNumber: 2,
			items: {
				type: 'object',
				required: ['chainID', 'supportedCollectionIDArray'],
				properties: {
					chainID: {
						dataType: 'bytes',
						fieldNumber: 1,
					},
					supportedCollectionIDArray: {
						type: 'array',
						fieldNumber: 2,
						items: {
							type: 'object',
							required: ['collectionID'],
							properties: {
								collectionID: {
									dataType: 'bytes',
									minLength: LENGTH_COLLECTION_ID,
									maxLength: LENGTH_COLLECTION_ID,
									fieldNumber: 1,
								},
							},
						},
					},
				},
			},
		},
	},
};
