import { TransactionVerifyContext } from 'lisk-sdk';
import { TokenFactoryModuleConfig } from '../types';

// eslint-disable-next-line @typescript-eslint/require-await
export async function verifyMinimumFee(
	context: TransactionVerifyContext,
	config: TokenFactoryModuleConfig,
) {
	if (context.transaction.module === 'tokenFactory' && context.transaction.command === 'create') {
		if (context.transaction.fee < BigInt(config.createFee)) {
			throw new Error(`Insufficient transaction fee. Minimum required fee is ${config.createFee}.`);
		}
	}
}
