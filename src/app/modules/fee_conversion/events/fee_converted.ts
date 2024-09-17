/* eslint-disable import/no-cycle */
import { Modules } from 'klayr-sdk';
import { feeConvertedEventSchema } from '../schema';

export interface FeeConvertedEventData {
	moduleCommand: string;
	path: Buffer;
	token: Buffer;
	amount: string;
}

export class FeeConvertedEvent extends Modules.BaseEvent<FeeConvertedEventData> {
	public schema = feeConvertedEventSchema;
}
