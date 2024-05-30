/* eslint-disable import/no-cycle */
import { CrossChainMessageContext } from 'klayr-sdk';
import { PoolStore } from '../../stores/pool';
import { PoolAddress } from '../../stores/library/periphery';
import { crossChainMethodSwapContext } from '../../stores/context';
import { isSwapByCrossTransfer } from './isSwapByCrossTransfer';
import { DexInteroperableMethod } from '../../cc_method';

export async function executeSwapByCrossTransfer(
	this: DexInteroperableMethod,
	ctx: CrossChainMessageContext,
) {
	const check = await isSwapByCrossTransfer.bind(this)(ctx);
	if (check.status && check.payload) {
		const poolStore = this.stores.get(PoolStore);
		if (await poolStore.has(ctx.getMethodContext(), check.payload.recipientAddress)) {
			try {
				const _ctx = crossChainMethodSwapContext(ctx, check.payload.recipientAddress);
				const key = PoolAddress.decodePoolAddress(check.payload.recipientAddress);
				if (
					key.token0.compare(check.payload.tokenID) !== 0 &&
					key.token1.compare(check.payload.tokenID) !== 0
				) {
					throw new Error('transfering incompatible token to pool address');
				}

				const tokenIn = key.token0.compare(check.payload.tokenID) === 0 ? key.token0 : key.token1;
				const tokenOut = key.token0.compare(check.payload.tokenID) === 0 ? key.token1 : key.token0;
				const router = poolStore.getMutableRouter(_ctx);
				await router.exactInputSingle({
					tokenIn,
					tokenOut,
					fee: key.fee,
					recipient: check.payload.senderAddress,
					amountIn: check.payload.amount.toString(),
					amountOutMinimum: '0',
					sqrtPriceLimitX96: '0',
					deadline: ctx.header.timestamp.toString(),
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
