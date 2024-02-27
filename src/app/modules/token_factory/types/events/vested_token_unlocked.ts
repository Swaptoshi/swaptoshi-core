export interface VestedTokenUnlockedEventData {
	recipientAddress: Buffer;
	tokenId: Buffer;
	height: number;
	amount: bigint;
}
