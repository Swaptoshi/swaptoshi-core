/* eslint-disable import/no-cycle */
import { NamedRegistry, TransactionExecuteContext } from 'lisk-sdk';
import { ICOStore } from '../../stores/ico';
import { mutableTransactionHookFactoryContext } from '../../stores/context';
import { isSwapByTransfer } from './isSwapByTransfer';
import { decodeICOPoolAddress } from '../../stores/library';

export async function executeSwapByTransfer(
	this: { stores: NamedRegistry; events: NamedRegistry },
	ctx: TransactionExecuteContext,
) {
	const check = await isSwapByTransfer.bind(this)(ctx, ctx.transaction);
	if (check.status && check.payload) {
		const icoStore = this.stores.get(ICOStore);
		if (await icoStore.has(ctx, check.payload.recipientAddress)) {
			const _ctx = {
				...mutableTransactionHookFactoryContext(ctx),
				senderAddress: check.payload.recipientAddress,
			};
			const key = decodeICOPoolAddress(check.payload.recipientAddress);
			if (key.tokenIn.compare(check.payload.tokenID) !== 0) {
				throw new Error('transfering incompatible token to pool address');
			}

			const router = await icoStore.getMutableICORouter(_ctx);
			await router.exactInputSingle({
				tokenIn: check.payload.tokenID,
				tokenOut: key.tokenOut,
				amountIn: check.payload.amount,
				recipient: _ctx.context.transaction.senderAddress,
			});
		}
	}
}
