export interface VestedTokenLockedEventData {
	recipientAddress: Buffer;
	tokenId: Buffer;
	height: number;
	amount: bigint;
}
