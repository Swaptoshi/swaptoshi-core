import { BaseEvent } from 'klayr-sdk';
import { icoSwapEventSchema } from '../schema';
import { ICOSwapEventData } from '../types';

export class IcoSwapEvent extends BaseEvent<ICOSwapEventData> {
	public schema = icoSwapEventSchema;
}
