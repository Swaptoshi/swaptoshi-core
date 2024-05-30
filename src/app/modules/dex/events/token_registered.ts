import { BaseEvent } from 'klayr-sdk';
import { tokenRegisteredEventSchema } from '../schema/events/token_registered';

export interface TokenRegisteredData {
	tokenId: Buffer;
	symbol: string;
	decimal: number;
}

export class TokenRegisteredEvent extends BaseEvent<TokenRegisteredData> {
	public schema = tokenRegisteredEventSchema;
}
