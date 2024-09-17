/* eslint-disable import/no-cycle */
import { Modules } from 'klayr-sdk';
import { mintEventSchema } from '../schema';

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

export class MintEvent extends Modules.BaseEvent<MintEventData> {
	public schema = mintEventSchema;
}
