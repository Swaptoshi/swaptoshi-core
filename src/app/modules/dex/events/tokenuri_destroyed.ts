/* eslint-disable import/no-cycle */
import { BaseEvent } from 'klayr-sdk';
import { tokenUriDestroyedEventSchema } from '../schema';

export interface TokenURIDestroyedEventData {
	tokenURI: string;
	tokenId: Buffer;
}

export class TokenURIDestroyedEvent extends BaseEvent<TokenURIDestroyedEventData> {
	public schema = tokenUriDestroyedEventSchema;
}
