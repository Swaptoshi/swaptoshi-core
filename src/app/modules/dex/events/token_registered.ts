import { BaseEvent } from 'klayr-sdk';
import { tokenRegisteredEventSchema } from '../schema';

export interface TokenRegisteredData {
	tokenId: Buffer;
	symbol: string;
	decimal: number;
}

export class TokenRegisteredEvent extends BaseEvent<TokenRegisteredData> {
	public schema = tokenRegisteredEventSchema;
}
