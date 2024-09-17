/* eslint-disable import/no-cycle */
import { Modules } from 'klayr-sdk';
import { tokenUriDestroyedEventSchema } from '../schema';

export interface TokenURIDestroyedEventData {
	tokenURI: string;
	tokenId: Buffer;
}

export class TokenURIDestroyedEvent extends Modules.BaseEvent<TokenURIDestroyedEventData> {
	public schema = tokenUriDestroyedEventSchema;
}
