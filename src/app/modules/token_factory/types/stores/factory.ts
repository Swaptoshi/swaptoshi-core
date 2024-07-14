export interface FactoryStoreData {
	owner: Buffer;
	attributesArray: TokenFactoryAttributes[];
}

export interface TokenFactoryAttributes {
	key: string;
	attributes: Buffer;
}
