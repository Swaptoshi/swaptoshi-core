import { cryptography } from 'klayr-sdk';

// klyr49epb3jdyqmnfyrz7jdc5ws3rmyuqzje4c4jb
export const DEFAULT_TREASURY_ADDRESS = cryptography.utils.hash('GovernanceTreasuryAccount', 'utf8').subarray(0, 20);

export const ADDRESS_LENGTH = 20;
