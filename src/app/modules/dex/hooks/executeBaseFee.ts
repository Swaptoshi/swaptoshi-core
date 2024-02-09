import { FeeMethod, TransactionExecuteContext } from 'lisk-sdk';
import { DexModuleConfig } from '../types';

// eslint-disable-next-line @typescript-eslint/require-await
export async function executeBaseFee(
	this: {
		name: string;
		_feeMethod: FeeMethod | undefined;
		_config: DexModuleConfig | undefined;
	},
	context: TransactionExecuteContext,
) {
	if (!this._config || !this._feeMethod) return;

	if (
		context.transaction.module === this.name &&
		this._config.baseFee[context.transaction.command] &&
		BigInt(this._config.baseFee[context.transaction.command] as string) > BigInt(0)
	) {
		this._feeMethod.payFee(
			context,
			BigInt(this._config.baseFee[context.transaction.command] as string),
		);
	}
}
