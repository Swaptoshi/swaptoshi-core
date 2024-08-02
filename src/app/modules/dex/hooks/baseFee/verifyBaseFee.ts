/* eslint-disable import/no-cycle */
import { FeeMethod, TransactionVerifyContext } from 'klayr-sdk';
import { DexGovernableConfig } from '../../config';

// eslint-disable-next-line @typescript-eslint/require-await
export async function verifyBaseFee(
	this: {
		name: string;
		_feeMethod: FeeMethod | undefined;
		_config: DexGovernableConfig;
	},
	context: TransactionVerifyContext,
) {
	if (!this._config || !this._feeMethod) return;

	const config = await this._config.getConfig(context);

	if (context.transaction.module === this.name) {
		if (context.transaction.fee < BigInt(config.baseFee[context.transaction.command] as string)) {
			throw new Error(`Insufficient transaction fee to pay for base fee of ${config.baseFee[context.transaction.command] as string}`);
		}
	}
}
