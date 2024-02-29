import { ImmutableMethodContext, NamedRegistry, Transaction, codec } from 'lisk-sdk';
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
	context: ImmutableMethodContext,
	transaction: Transaction,
) {
	if (transaction.module === 'token' && transaction.command === 'transfer') {
		const params = codec.decode<TransferTokenParams>(tokenTransferParamsSchema, transaction.params);

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
