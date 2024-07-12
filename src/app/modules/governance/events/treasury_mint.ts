import { BaseEvent } from 'klayr-sdk';
import { treasuryMintEventSchema } from '../schema';

export interface TreasuryMintEventData {
	amount: bigint;
}

export class TreasuryMintEvent extends BaseEvent<TreasuryMintEventData> {
	public schema = treasuryMintEventSchema;
}
