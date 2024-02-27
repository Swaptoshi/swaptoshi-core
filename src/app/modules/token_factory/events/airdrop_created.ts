import { BaseEvent } from 'lisk-sdk';
import { airdropCreatedEventSchema } from '../schema';
import { AirdropCreatedEventData } from '../types';

export class AirdropCreatedEvent extends BaseEvent<AirdropCreatedEventData> {
	public schema = airdropCreatedEventSchema;
}
