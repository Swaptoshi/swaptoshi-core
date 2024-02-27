import { BaseEvent } from 'lisk-sdk';
import { airdropRecipientsChangedEventSchema } from '../schema';
import { AirdropRecipientsChangedEventData } from '../types';

export class AirdropRecipientsChangedEvent extends BaseEvent<AirdropRecipientsChangedEventData> {
	public schema = airdropRecipientsChangedEventSchema;
}
