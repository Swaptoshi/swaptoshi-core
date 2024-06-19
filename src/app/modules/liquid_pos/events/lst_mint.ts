import { BaseEvent } from 'klayr-sdk';
import { liquidStakingTokenMintEventSchema } from '../schema';

export interface LiquidStakingTokenMintEventData {
	address: Buffer;
	tokenID: Buffer;
	amount: bigint;
}

export class LiquidStakingTokenMintEvent extends BaseEvent<LiquidStakingTokenMintEventData> {
	public schema = liquidStakingTokenMintEventSchema;
}
