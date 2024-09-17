/* eslint-disable import/no-cycle */
import { Modules, StateMachine } from 'klayr-sdk';
import { PoolAddress } from '../../stores/library/periphery';
import { isSwapByTransfer } from './isSwapByTransfer';

export async function verifySwapByTransfer(this: { stores: Modules.NamedRegistry; events: Modules.NamedRegistry }, context: StateMachine.TransactionVerifyContext) {
	const check = await isSwapByTransfer.bind(this)(context, context.transaction);
	if (check.status && check.payload) {
		const key = PoolAddress.decodePoolAddress(check.payload.recipientAddress);
		if (key.token0.compare(check.payload.tokenID) !== 0 && key.token1.compare(check.payload.tokenID) !== 0) {
			throw new Error('transfering incompatible token to pool address');
		}
	}
}
