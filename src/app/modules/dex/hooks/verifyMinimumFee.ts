import { TransactionVerifyContext } from 'lisk-sdk';
import { DexModuleConfig } from '../types';

// eslint-disable-next-line @typescript-eslint/require-await
export async function verifyMinimumFee(context: TransactionVerifyContext, config: DexModuleConfig) {
	if (context.transaction.module === 'dex') {
		if (
			context.transaction.fee <
			BigInt(config.minTransactionFee[context.transaction.command] as string)
		) {
			throw new Error(
				`Insufficient transaction fee. Minimum required fee is ${
					config.minTransactionFee[context.transaction.command] as string
				}.`,
			);
		}
	}
}
