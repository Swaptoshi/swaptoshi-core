export interface GenesisNFTStore {
	nftSubstore: {
		nftID: Buffer;
		owner: Buffer;
		attributesArray: {
			module: string;
			attributes: Buffer;
		}[];
	}[];
	supportedNFTsSubstore: {
		chainID: Buffer;
		supportedCollectionIDArray: {
			collectionID: Buffer;
		}[];
	}[];
}
