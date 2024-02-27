/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { TransactionVerifyContext } from 'lisk-sdk';
import { TokenFactoryModuleConfig } from '../../types';

// eslint-disable-next-line @typescript-eslint/require-await
export async function verifyMinimumFee(
	this: {
		name: string;
		_config: TokenFactoryModuleConfig | undefined;
	},
	context: TransactionVerifyContext,
) {
	if (context.transaction.module === this.name) {
		if (
			context.transaction.fee <
			BigInt(this._config!.minTransactionFee[context.transaction.command] as string)
		) {
			throw new Error(
				`Insufficient transaction fee. Minimum required fee is ${
					this._config!.minTransactionFee[context.transaction.command] as string
				}.`,
			);
		}
	}
}
