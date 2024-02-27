export interface AirdropDistributedEventData {
	tokenId: Buffer;
	senderAddress: Buffer;
	recipientAddress: Buffer;
	amount: bigint;
}
