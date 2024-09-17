/* eslint-disable import/no-cycle */
import { Modules } from 'klayr-sdk';
import { tokenRegisteredEventSchema } from '../schema';

export interface TokenRegisteredData {
	tokenId: Buffer;
	symbol: string;
	decimal: number;
}

export class TokenRegisteredEvent extends Modules.BaseEvent<TokenRegisteredData> {
	public schema = tokenRegisteredEventSchema;
}
