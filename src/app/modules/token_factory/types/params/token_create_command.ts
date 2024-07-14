import { TokenFactoryAttributes } from '../stores';

export interface TokenCreateParams {
	distribution: {
		recipientAddress: Buffer;
		amount: bigint;
		vesting: {
			height: number;
			amount: bigint;
		}[];
	}[];
	attributes: TokenFactoryAttributes[];
}
