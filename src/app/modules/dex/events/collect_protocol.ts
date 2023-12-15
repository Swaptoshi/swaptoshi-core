import { BaseEvent } from 'lisk-sdk';
import { collectProtocolEventSchema } from '../schema/events/collect_protocol';

export interface CollectProtocolEventData {
	senderAddress: Buffer;
	recipientAddress: Buffer;
	amount0: string;
	amount1: string;
}

export class CollectProtocolEvent extends BaseEvent<CollectProtocolEventData> {
	public schema = collectProtocolEventSchema;
}
