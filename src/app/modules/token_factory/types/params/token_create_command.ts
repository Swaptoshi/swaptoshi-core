export interface TokenCreateParams {
	distribution: {
		recipientAddress: Buffer;
		amount: bigint;
		vesting: {
			height: number;
			amount: bigint;
		}[];
	}[];
}
