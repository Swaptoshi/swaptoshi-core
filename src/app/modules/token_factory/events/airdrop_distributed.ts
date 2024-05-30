import { BaseEvent } from 'klayr-sdk';
import { airdropDistributedEventSchema } from '../schema';
import { AirdropDistributedEventData } from '../types';

export class AirdropDistributedEvent extends BaseEvent<AirdropDistributedEventData> {
	public schema = airdropDistributedEventSchema;
}
