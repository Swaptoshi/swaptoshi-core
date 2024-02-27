import { BaseEvent } from 'lisk-sdk';
import { airdropDistributedEventSchema } from '../schema';
import { AirdropDistributedEventData } from '../types';

export class AirdropDistributedEvent extends BaseEvent<AirdropDistributedEventData> {
	public schema = airdropDistributedEventSchema;
}
