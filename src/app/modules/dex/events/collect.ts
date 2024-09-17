/* eslint-disable import/no-cycle */
import { Modules } from 'klayr-sdk';
import { collectEventSchema } from '../schema';

export interface CollectEventData {
	senderAddress: Buffer;
	recipientAddress: Buffer;
	tickLower: string;
	tickUpper: string;
	amount0: string;
	amount1: string;
}

export class CollectEvent extends Modules.BaseEvent<CollectEventData> {
	public schema = collectEventSchema;
}
