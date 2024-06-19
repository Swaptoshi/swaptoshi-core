import { BaseEvent } from 'klayr-sdk';
import { tokenUriCreatedEventSchema } from '../schema';

export interface TokenURICreatedEventData {
	tokenURI: string;
	tokenId: Buffer;
}

export class TokenURICreatedEvent extends BaseEvent<TokenURICreatedEventData> {
	public schema = tokenUriCreatedEventSchema;
}
