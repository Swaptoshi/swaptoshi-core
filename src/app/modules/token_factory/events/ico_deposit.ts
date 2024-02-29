import { BaseEvent } from 'lisk-sdk';
import { icoDepositEventSchema } from '../schema';
import { ICODepositEventData } from '../types';

export class IcoDepositEvent extends BaseEvent<ICODepositEventData> {
	public schema = icoDepositEventSchema;
}
