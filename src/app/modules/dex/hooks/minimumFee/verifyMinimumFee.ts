/* eslint-disable import/no-cycle */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { StateMachine } from 'klayr-sdk';
import { DexGovernableConfig } from '../../config';

// eslint-disable-next-line @typescript-eslint/require-await
export async function verifyMinimumFee(
	this: {
		name: string;
		_config: DexGovernableConfig;
	},
	context: StateMachine.TransactionVerifyContext,
) {
	if (context.transaction.module === this.name) {
		const config = await this._config.getConfig(context);

		if (context.transaction.fee < BigInt(config.minTransactionFee[context.transaction.command] as string)) {
			throw new Error(`Insufficient transaction fee. Minimum required fee is ${config.minTransactionFee[context.transaction.command] as string}.`);
		}
	}
}
