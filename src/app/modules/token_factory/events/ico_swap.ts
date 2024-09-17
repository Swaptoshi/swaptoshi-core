import { Modules } from 'klayr-sdk';
import { icoSwapEventSchema } from '../schema';
import { ICOSwapEventData } from '../types';

export class IcoSwapEvent extends Modules.BaseEvent<ICOSwapEventData> {
	public schema = icoSwapEventSchema;
}
