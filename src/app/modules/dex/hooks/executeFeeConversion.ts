import { FeeMethod, NamedRegistry, TokenMethod, TransactionExecuteContext } from 'lisk-sdk';
import { DexModuleConfig } from '../types';
import { isFeeConversion } from './shared/isFeeConversion';
import { PoolStore } from '../stores/pool';
import { mutableHookSwapContext } from '../stores/context';

export async function executeFeeConversion(
	this: {
		stores: NamedRegistry;
		events: NamedRegistry;
		_feeMethod: FeeMethod | undefined;
		_tokenMethod: TokenMethod | undefined;
		_config: DexModuleConfig | undefined;
	},
	context: TransactionExecuteContext,
) {
	if (!this._config || !this._tokenMethod || !this._feeMethod) return;
	const check = await isFeeConversion.bind(this)(context);
	if (check.status && check.payload) {
		const senderTokenInBalance = await this._tokenMethod.getAvailableBalance(
			context,
			context.transaction.senderAddress,
			check.payload.tokenIn,
		);
		if (senderTokenInBalance < BigInt(check.payload.amountIn)) {
			throw new Error(
				`Insufficient ${check.payload.tokenIn.toString(
					'hex',
				)} balance for feeConversion. Minimum required balance is ${check.payload.amountIn}.`,
			);
		}
		if (senderTokenInBalance < BigInt(check.payload.amountIn) + BigInt(check.payload.swapAmount)) {
			throw new Error(
				`Insufficient ${check.payload.tokenIn.toString('hex')} balance to swap ${
					check.payload.swapAmount
				} of tokens with feeConversion. Total minimum required balance is ${(
					BigInt(check.payload.amountIn) + BigInt(check.payload.swapAmount)
				).toString()}.`,
			);
		}

		const ctx = mutableHookSwapContext(context);
		const poolStore = this.stores.get(PoolStore);
		const router = poolStore.getMutableRouter(ctx);
		await router.exactOutputSingle({
			tokenIn: check.payload.tokenIn,
			tokenOut: check.payload.tokenOut,
			fee: check.payload.fee,
			amountInMaximum: check.payload.amountIn,
			sqrtPriceLimitX96: '0',
			amountOut: check.payload.amountOut,
			recipient: context.transaction.senderAddress,
			deadline: context.header.timestamp.toString(),
		});
	} else {
		const balance = await this._tokenMethod.getAvailableBalance(
			context,
			context.transaction.senderAddress,
			this._feeMethod.getFeeTokenID(),
		);
		if (context.transaction.fee > balance) {
			throw new Error(`Insufficient balance.`);
		}
	}
}
