import { Modules } from 'klayr-sdk';
import { airdropRecipientsChangedEventSchema } from '../schema';
import { AirdropRecipientsChangedEventData } from '../types';

export class AirdropRecipientsChangedEvent extends Modules.BaseEvent<AirdropRecipientsChangedEventData> {
	public schema = airdropRecipientsChangedEventSchema;
}
