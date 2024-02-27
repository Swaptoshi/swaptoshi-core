import { NamedRegistry, TransactionVerifyContext, codec } from 'lisk-sdk';
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
	context: TransactionVerifyContext,
) {
	if (context.transaction.module === 'token' && context.transaction.command === 'transfer') {
		const params = codec.decode<TransferTokenParams>(
			tokenTransferParamsSchema,
			context.transaction.params,
		);

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
