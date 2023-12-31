import { BaseEvent } from 'lisk-sdk';
import { mintEventSchema } from '../schema/events/mint';

export interface MintEventData {
	senderAddress: Buffer;
	recipientAddress: Buffer;
	tickLower: string;
	tickUpper: string;
	lowerLiquidityNetBefore: string;
	lowerLiquidityNet: string;
	upperLiquidityNetBefore: string;
	upperLiquidityNet: string;
}

export class MintEvent extends BaseEvent<MintEventData> {
	public schema = mintEventSchema;
}
