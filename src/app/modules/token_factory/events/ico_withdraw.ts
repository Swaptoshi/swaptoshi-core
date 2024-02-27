import { BaseEvent } from 'lisk-sdk';
import { icoWithdrawEventSchema } from '../schema';
import { ICOWithdrawEventData } from '../types';

export class ICOWithdrawEvent extends BaseEvent<ICOWithdrawEventData> {
	public schema = icoWithdrawEventSchema;
}
