import { BaseEvent } from 'klayr-sdk';
import { collectPositionEventSchema } from '../schema';

export interface CollectPositionEventData {
	tokenId: Buffer;
	recipientAddress: Buffer;
	amount0Collect: string;
	amount1Collect: string;
}

export class CollectPositionEvent extends BaseEvent<CollectPositionEventData> {
	public schema = collectPositionEventSchema;
}
