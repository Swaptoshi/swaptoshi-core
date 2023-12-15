import { BaseEvent } from 'lisk-sdk';
import { flashEventSchema } from '../schema/events/flash';

export interface FlashEventData {
	senderAddress: Buffer;
	recipientAddress: Buffer;
	amount0: string;
	amount1: string;
	paid0: string;
	paid1: string;
}

export class FlashEvent extends BaseEvent<FlashEventData> {
	public schema = flashEventSchema;
}
