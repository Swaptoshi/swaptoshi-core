import { cryptography } from 'klayr-sdk';

// klyr49epb3jdyqmnfyrz7jdc5ws3rmyuqzje4c4jb
export const DEFAULT_TREASURY_ADDRESS = cryptography.utils.hash('GovernanceTreasuryAccount', 'utf8').subarray(0, 20);

// klywcryfecu7yyyggmuyqcetwxzgnz73ra5hf8cde
export const POSITION_MANAGER_ADDRESS = cryptography.utils.hash('PositionManagerAddress', 'utf8').subarray(0, 20);

// klyo5pdmf2zvezocqfyoejt37so5myqzqxfdke6go
export const ROUTER_ADDRESS = cryptography.utils.hash('SwapRouterAddress', 'utf8').subarray(0, 20);
