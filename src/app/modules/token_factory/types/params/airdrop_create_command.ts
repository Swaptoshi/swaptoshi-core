export interface AirdropCreateParams {
	tokenId: Buffer;
	providerAddress: Buffer;
	recipients: {
		address: Buffer;
		amountDelta: bigint;
	}[];
}
