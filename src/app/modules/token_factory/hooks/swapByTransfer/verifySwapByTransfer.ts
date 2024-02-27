import { NamedRegistry, TransactionVerifyContext } from 'lisk-sdk';
import { isSwapByTransfer } from './isSwapByTransfer';
import { decodeICOPoolAddress } from '../../stores/library';

export async function verifySwapByTransfer(
	this: { stores: NamedRegistry; events: NamedRegistry },
	context: TransactionVerifyContext,
) {
	const check = await isSwapByTransfer.bind(this)(context);
	if (check.status && check.payload) {
		const key = decodeICOPoolAddress(check.payload.recipientAddress);
		if (key.tokenIn.compare(check.payload.tokenID) !== 0) {
			throw new Error('transfering incompatible token to ICO pool address');
		}
	}
}
