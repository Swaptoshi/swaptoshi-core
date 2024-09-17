/* eslint-disable import/no-cycle */
import { Modules, StateMachine } from 'klayr-sdk';
import { isSwapByTransfer } from './isSwapByTransfer';
import { decodeICOPoolAddress } from '../../stores/library';

export async function verifySwapByTransfer(this: { stores: Modules.NamedRegistry; events: Modules.NamedRegistry }, context: StateMachine.TransactionVerifyContext) {
	const check = await isSwapByTransfer.bind(this)(context, context.transaction);
	if (check.status && check.payload) {
		const key = decodeICOPoolAddress(check.payload.recipientAddress);
		if (key.tokenIn.compare(check.payload.tokenID) !== 0) {
			throw new Error('transfering incompatible token to ICO pool address');
		}
	}
}
