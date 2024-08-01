/* eslint-disable import/no-cycle */
import { FeeMethod, TransactionExecuteContext } from 'klayr-sdk';
import { TokenFactoryGovernableConfig } from '../../config';

// eslint-disable-next-line @typescript-eslint/require-await
export async function executeBaseFee(
	this: {
		name: string;
		_feeMethod: FeeMethod | undefined;
		_config: TokenFactoryGovernableConfig;
	},
	context: TransactionExecuteContext,
) {
	if (!this._feeMethod) return;

	const config = await this._config.getConfig(context);

	if (context.transaction.module === this.name && config.baseFee[context.transaction.command] && BigInt(config.baseFee[context.transaction.command] as string) > BigInt(0)) {
		this._feeMethod.payFee(context, BigInt(config.baseFee[context.transaction.command] as string));
	}
}
