import { Modules } from 'klayr-sdk';
import { liquidStakingTokenBurnEventSchema } from '../schema';

export interface LiquidStakingTokenBurnEventData {
	address: Buffer;
	tokenID: Buffer;
	amount: bigint;
}

export class LiquidStakingTokenBurnEvent extends Modules.BaseEvent<LiquidStakingTokenBurnEventData> {
	public schema = liquidStakingTokenBurnEventSchema;
}
