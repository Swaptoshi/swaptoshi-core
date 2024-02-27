import { BaseEvent } from 'lisk-sdk';
import { icoSwapEventSchema } from '../schema';
import { ICOSwapEventData } from '../types';

export class ICOSwapEvent extends BaseEvent<ICOSwapEventData> {
	public schema = icoSwapEventSchema;
}
