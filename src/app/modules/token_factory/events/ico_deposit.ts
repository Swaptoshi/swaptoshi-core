import { BaseEvent } from 'lisk-sdk';
import { icoDepositEventSchema } from '../schema';
import { ICODepositEventData } from '../types';

export class ICODepositEvent extends BaseEvent<ICODepositEventData> {
	public schema = icoDepositEventSchema;
}
