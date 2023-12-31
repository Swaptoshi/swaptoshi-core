import { BaseEvent } from 'lisk-sdk';
import { collectEventSchema } from '../schema/events/collect';

export interface CollectEventData {
	senderAddress: Buffer;
	recipientAddress: Buffer;
	tickLower: string;
	tickUpper: string;
	amount0: string;
	amount1: string;
}

export class CollectEvent extends BaseEvent<CollectEventData> {
	public schema = collectEventSchema;
}
