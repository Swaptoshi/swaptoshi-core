/* eslint-disable import/no-cycle */
import { FeeMethod, NamedRegistry, TokenMethod, TransactionExecuteContext } from 'klayr-sdk';
import { TokenFactoryModuleConfig } from '../../types';
import { DexMethod } from '../../../dex/method';
import { TokenFactoryMethod } from '../../method';

export async function executeFeeConversion(
	this: {
		name: string;
		stores: NamedRegistry;
		events: NamedRegistry;
		method: TokenFactoryMethod;
		_feeMethod: FeeMethod | undefined;
		_tokenMethod: TokenMethod | undefined;
		_dexMethod: DexMethod | undefined;
		_config: TokenFactoryModuleConfig | undefined;
	},
	context: TransactionExecuteContext,
) {
	if (!this._config || !this._tokenMethod || !this._feeMethod || !this._dexMethod) return;

	const check = await this.method.isFeeConversion(
		context,
		context.transaction,
		context.header.timestamp,
		context.header.height,
	);

	const dexCheck = await this._dexMethod.isFeeConversion(
		context,
		context.transaction,
		context.header.timestamp,
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

		const dexRouter = await this._dexMethod.getRouter(
			context,
			context.transaction.senderAddress,
			context.header.timestamp,
		);

		await dexRouter.exactOutputSingle({
			tokenIn: check.payload.tokenIn,
			tokenOut: check.payload.tokenOut,
			fee: check.payload.fee,
			amountInMaximum: check.payload.amountIn,
			sqrtPriceLimitX96: '0',
			amountOut: check.payload.amountOut,
			recipient: context.transaction.senderAddress,
			deadline: context.header.timestamp.toString(),
		});
	} else if (dexCheck.status && dexCheck.payload) {
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
