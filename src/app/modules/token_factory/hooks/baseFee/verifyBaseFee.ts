import { FeeMethod, TransactionVerifyContext } from 'klayr-sdk';
import { TokenFactoryModuleConfig } from '../../types';

// eslint-disable-next-line @typescript-eslint/require-await
export async function verifyBaseFee(
	this: {
		name: string;
		_feeMethod: FeeMethod | undefined;
		_config: TokenFactoryModuleConfig | undefined;
	},
	context: TransactionVerifyContext,
) {
	if (!this._config || !this._feeMethod) return;

	if (context.transaction.module === this.name) {
		if (
			context.transaction.fee < BigInt(this._config.baseFee[context.transaction.command] as string)
		) {
			throw new Error(
				`Insufficient transaction fee to pay for base fee of ${
					this._config.baseFee[context.transaction.command] as string
				}`,
			);
		}
	}
}
