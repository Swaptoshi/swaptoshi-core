import { BaseEvent } from 'klayr-sdk';
import { feeConvertedEventSchema } from '../schema/events/fee_converted';

export interface FeeConvertedEventData {
	moduleCommand: string;
	poolAddress: Buffer;
	token: Buffer;
	amount: string;
}

export class FeeConvertedEvent extends BaseEvent<FeeConvertedEventData> {
	public schema = feeConvertedEventSchema;
}
