import { NamedRegistry, TransactionVerifyContext } from 'lisk-sdk';
import { PoolAddress } from '../stores/library/periphery';
import { isSwapByTransfer } from './shared/isSwapByTransfer';

export async function verifySwapByTransfer(
	this: { stores: NamedRegistry; events: NamedRegistry },
	context: TransactionVerifyContext,
) {
	const check = await isSwapByTransfer.bind(this)(context);
	if (check.status && check.payload) {
		const key = PoolAddress.decodePoolAddress(check.payload.recipientAddress);
		if (
			key.token0.compare(check.payload.tokenID) !== 0 &&
			key.token1.compare(check.payload.tokenID) !== 0
		) {
			throw new Error('transfering incompatible token to pool address');
		}
	}
}
