/* eslint-disable import/no-cycle */
import { BaseEvent } from 'klayr-sdk';
import { feeConvertedEventSchema } from '../schema';

export interface FeeConvertedEventData {
	moduleCommand: string;
	path: Buffer;
	token: Buffer;
	amount: string;
}

export class FeeConvertedEvent extends BaseEvent<FeeConvertedEventData> {
	public schema = feeConvertedEventSchema;
}
