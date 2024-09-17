/* eslint-disable import/no-cycle */
import { Modules } from 'klayr-sdk';
import { burnEventSchema } from '../schema';

export interface BurnEventData {
	senderAddress: Buffer;
	tickLower: string;
	tickUpper: string;
	lowerLiquidityNetBefore: string;
	lowerLiquidityNet: string;
	upperLiquidityNetBefore: string;
	upperLiquidityNet: string;
}

export class BurnEvent extends Modules.BaseEvent<BurnEventData> {
	public schema = burnEventSchema;
}
