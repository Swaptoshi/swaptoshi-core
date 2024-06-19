import { BaseEvent } from 'klayr-sdk';
import { liquidStakingTokenBurnEventSchema } from '../schema';

export interface LiquidStakingTokenBurnEventData {
	address: Buffer;
	tokenID: Buffer;
	amount: bigint;
}

export class LiquidStakingTokenBurnEvent extends BaseEvent<LiquidStakingTokenBurnEventData> {
	public schema = liquidStakingTokenBurnEventSchema;
}
