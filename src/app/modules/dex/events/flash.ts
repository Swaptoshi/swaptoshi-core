/* eslint-disable import/no-cycle */
import { BaseEvent } from 'klayr-sdk';
import { flashEventSchema } from '../schema';

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
