/* eslint-disable import/no-cycle */
import { Modules } from 'klayr-sdk';
import { Uint256String } from '../stores/library/int';
import { treasurifyEventSchema } from '../schema';

export interface TreasurifyEventsData {
	poolAddress: Buffer;
	treasuryAddress: Buffer;
	token: Buffer;
	amount: Uint256String;
}

export class TreasurifyEvent extends Modules.BaseEvent<TreasurifyEventsData> {
	public schema = treasurifyEventSchema;
}
