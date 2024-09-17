import { Modules } from 'klayr-sdk';
import { airdropDistributedEventSchema } from '../schema';
import { AirdropDistributedEventData } from '../types';

export class AirdropDistributedEvent extends Modules.BaseEvent<AirdropDistributedEventData> {
	public schema = airdropDistributedEventSchema;
}
