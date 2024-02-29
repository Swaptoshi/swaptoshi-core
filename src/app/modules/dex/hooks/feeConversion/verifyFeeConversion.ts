/* eslint-disable import/no-cycle */
import { FeeMethod, NamedRegistry, TokenMethod, TransactionVerifyContext } from 'lisk-sdk';
import { DexModuleConfig } from '../../types';
import { DexMethod } from '../../method';
import { TokenFactoryMethod } from '../../../token_factory/method';

export async function verifyFeeConversion(
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
	context: TransactionVerifyContext,
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
