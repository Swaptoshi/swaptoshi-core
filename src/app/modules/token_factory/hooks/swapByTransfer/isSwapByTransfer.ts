/* eslint-disable import/no-cycle */
import { ImmutableMethodContext, NamedRegistry, Transaction, codec } from 'lisk-sdk';
import { ICOStore } from '../../stores/ico';
import { tokenTransferParamsSchema } from '../../schema';

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

		const icoStore = this.stores.get(ICOStore);
		if (await icoStore.has(context, params.recipientAddress)) {
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
