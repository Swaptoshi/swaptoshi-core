import { BaseEvent } from 'klayr-sdk';
import { tokenUriDestroyedEventSchema } from '../schema/events/tokenuri_destroyed';

export interface TokenURIDestroyedEventData {
	tokenURI: string;
	tokenId: Buffer;
}

export class TokenURIDestroyedEvent extends BaseEvent<TokenURIDestroyedEventData> {
	public schema = tokenUriDestroyedEventSchema;
}
