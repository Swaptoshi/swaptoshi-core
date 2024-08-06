import { BaseEvent } from 'klayr-sdk';
import { treasuryMintEventSchema } from '../schema';
import { TreasuryMintEventData } from '../types';

export class TreasuryMintEvent extends BaseEvent<TreasuryMintEventData> {
	public schema = treasuryMintEventSchema;
}
