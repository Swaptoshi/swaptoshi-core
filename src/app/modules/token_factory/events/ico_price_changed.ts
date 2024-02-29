import { BaseEvent } from 'lisk-sdk';
import { icoPriceChangedEventSchema } from '../schema';
import { ICOPriceChangedEventData } from '../types';

export class IcoPriceChangedEvent extends BaseEvent<ICOPriceChangedEventData> {
	public schema = icoPriceChangedEventSchema;
}
