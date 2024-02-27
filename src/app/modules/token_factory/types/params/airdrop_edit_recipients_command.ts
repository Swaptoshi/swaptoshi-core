export interface AirdropEditRecipientsParams {
	tokenId: Buffer;
	recipients: {
		address: Buffer;
		amountDelta: bigint;
	}[];
}
