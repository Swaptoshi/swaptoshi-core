import { cryptography } from 'klayr-sdk';

// klyr49epb3jdyqmnfyrz7jdc5ws3rmyuqzje4c4jb
export const DEFAULT_LEFTOVER_ADDRESS = cryptography.utils
	.hash('GovernanceTreasuryAccount', 'utf8')
	.subarray(0, 20);
