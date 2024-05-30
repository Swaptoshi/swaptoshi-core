/* eslint-disable import/no-cycle */
import { CrossChainMessageContext } from 'klayr-sdk';
import { crossChainMethodFactoryContext } from '../../stores/context';
import { isSwapByCrossTransfer } from './isSwapByCrossTransfer';
import { TokenFactoryInteroperableMethod } from '../../cc_method';
import { decodeICOPoolAddress } from '../../stores/library';
import { ICOStore } from '../../stores/ico';

export async function executeSwapByCrossTransfer(
	this: TokenFactoryInteroperableMethod,
	ctx: CrossChainMessageContext,
) {
	const check = await isSwapByCrossTransfer.bind(this)(ctx);
	if (check.status && check.payload) {
		const icoStore = this.stores.get(ICOStore);
		if (await icoStore.has(ctx.getMethodContext(), check.payload.recipientAddress)) {
			try {
				const _ctx = crossChainMethodFactoryContext(ctx, check.payload.recipientAddress);
				const key = decodeICOPoolAddress(check.payload.recipientAddress);
				if (key.tokenIn.compare(check.payload.tokenID) !== 0) {
					throw new Error('transfering incompatible token to ICO pool address');
				}
				const router = await icoStore.getMutableICORouter(_ctx);
				await router.exactInputSingle({
					tokenIn: check.payload.tokenID,
					tokenOut: key.tokenOut,
					amountIn: check.payload.amount,
					recipient: check.payload.senderAddress,
				});
			} catch {
				await this._tokenMethod?.transfer(
					ctx.getMethodContext(),
					check.payload.recipientAddress,
					check.payload.senderAddress,
					check.payload.tokenID,
					check.payload.amount,
				);
			}
		}
	}
}
