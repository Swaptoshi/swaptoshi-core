import { NamedRegistry, TransactionVerifyContext, codec } from 'lisk-sdk';
import { PoolStore } from '../../stores/pool';
import { tokenTransferParamsSchema } from '../../schema/dependencies/token';

interface TransferTokenParams {
	tokenID: Buffer;
	amount: bigint;
	recipientAddress: Buffer;
	data: string;
}

export async function isSwapByTransfer(
	this: { stores: NamedRegistry; events: NamedRegistry },
	context: TransactionVerifyContext,
) {
	if (context.transaction.module === 'token' && context.transaction.command === 'transfer') {
		const params = codec.decode<TransferTokenParams>(
			tokenTransferParamsSchema,
			context.transaction.params,
		);

		const poolStore = this.stores.get(PoolStore);
		if (await poolStore.has(context, params.recipientAddress)) {
			return {
				status: true,
				payload: params,
			};
		}
	}
	return {
		status: false,
		payload: undefined,
	};
}
