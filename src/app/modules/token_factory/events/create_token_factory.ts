import { BaseEvent } from 'lisk-sdk';
import { createTokenFactoryEventSchema } from '../schema/events/create_token_factory';
import { CreateTokenFactoryEventData } from '../types';

export class CreateTokenFactoryEvent extends BaseEvent<CreateTokenFactoryEventData> {
	public schema = createTokenFactoryEventSchema;
}
