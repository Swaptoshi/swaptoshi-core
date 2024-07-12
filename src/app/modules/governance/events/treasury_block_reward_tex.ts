import { BaseEvent } from 'klayr-sdk';
import { treasuryBlockRewardTaxEventSchema } from '../schema';

export interface TreasuryBlockRewardTaxEventData {
	amount: bigint;
	generatorAddress: Buffer;
}

export class TreasuryBlockRewardTaxEvent extends BaseEvent<TreasuryBlockRewardTaxEventData> {
	public schema = treasuryBlockRewardTaxEventSchema;
}
