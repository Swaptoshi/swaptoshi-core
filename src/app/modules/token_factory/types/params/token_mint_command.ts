export interface TokenMintParams {
	tokenId: Buffer;
	distribution: {
		recipientAddress: Buffer;
		amount: bigint;
		vesting: {
			height: number;
			amount: bigint;
		}[];
	}[];
}
