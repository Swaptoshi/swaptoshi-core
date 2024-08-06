export interface FundingActionPayload {
	tokenId: Buffer;
	receivingAddress: Buffer;
	fundingAmount: bigint;
}
