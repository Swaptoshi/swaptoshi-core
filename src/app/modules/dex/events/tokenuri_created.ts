import { BaseEvent } from 'klayr-sdk';
import { tokenUriCreatedEventSchema } from '../schema/events/tokenuri_created';

export interface TokenURICreatedEventData {
	tokenURI: string;
	tokenId: Buffer;
}

export class TokenURICreatedEvent extends BaseEvent<TokenURICreatedEventData> {
	public schema = tokenUriCreatedEventSchema;
}
