import { BaseEvent } from 'klayr-sdk';
import { treasuryBlockRewardTaxEventSchema } from '../schema';
import { TreasuryBlockRewardTaxEventData } from '../types';

export class TreasuryBlockRewardTaxEvent extends BaseEvent<TreasuryBlockRewardTaxEventData> {
	public schema = treasuryBlockRewardTaxEventSchema;
}
