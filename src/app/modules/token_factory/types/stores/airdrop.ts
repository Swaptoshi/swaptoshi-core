export interface AirdropStoreData {
	recipients: {
		address: Buffer;
		amount: bigint;
	}[];
}
