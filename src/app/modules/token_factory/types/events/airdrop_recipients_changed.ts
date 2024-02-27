export interface AirdropRecipientsChangedEventData {
	tokenId: Buffer;
	recipientAddress: Buffer;
	amountDelta: bigint;
}
