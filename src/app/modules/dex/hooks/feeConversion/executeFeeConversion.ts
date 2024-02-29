/* eslint-disable import/no-cycle */
import { FeeMethod, NamedRegistry, TokenMethod, TransactionExecuteContext } from 'lisk-sdk';
import { DexModuleConfig } from '../../types';
import { PoolStore } from '../../stores/pool';
import { mutableHookSwapContext } from '../../stores/context';
import { DexMethod } from '../../method';
import { TokenFactoryMethod } from '../../../token_factory/method';

export async function executeFeeConversion(
	this: {
		name: string;
		stores: NamedRegistry;
		events: NamedRegistry;
		method: DexMethod;
		_feeMethod: FeeMethod | undefined;
		_tokenMethod: TokenMethod | undefined;
		_tokenFactoryMethod: TokenFactoryMethod | undefined;
		_config: DexModuleConfig | undefined;
	},
	context: TransactionExecuteContext,
) {
	if (!this._config || !this._tokenMethod || !this._feeMethod || !this._tokenFactoryMethod) return;

	const check = await this.method.isFeeConversion(
		context,
		context.transaction,
		context.header.timestamp,
	);

	const tokenFactoryCheck = await this._tokenFactoryMethod.isFeeConversion(
		context,
		context.transaction,
		context.header.timestamp,
		context.header.height,
	);

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
	} else if (tokenFactoryCheck.status && tokenFactoryCheck.payload) {
		/* do nothing */
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
