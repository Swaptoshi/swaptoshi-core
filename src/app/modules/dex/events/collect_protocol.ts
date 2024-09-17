/* eslint-disable import/no-cycle */
import { Modules } from 'klayr-sdk';
import { collectProtocolEventSchema } from '../schema';

export interface CollectProtocolEventData {
	senderAddress: Buffer;
	recipientAddress: Buffer;
	amount0: string;
	amount1: string;
}

export class CollectProtocolEvent extends Modules.BaseEvent<CollectProtocolEventData> {
	public schema = collectProtocolEventSchema;
}
