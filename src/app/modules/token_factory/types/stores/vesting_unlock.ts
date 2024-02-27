export interface VestingUnlockStoreData {
	toBeUnlocked: {
		tokenId: Buffer;
		address: Buffer;
		amount: bigint;
	}[];
}
