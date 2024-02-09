import { NamedRegistry, TransactionVerifyContext, TransferCommand, codec } from 'lisk-sdk';
import { POSITION_MANAGER_ADDRESS, ROUTER_ADDRESS } from '../../constants';
import { PoolStore } from '../../stores/pool';
import { nftTransferParamsSchema } from '../../schema/dependencies/nft';

interface TransferTokenParams {
	tokenID: Buffer;
	amount: bigint;
	recipientAddress: Buffer;
	data: string;
}

interface TransferNFTParams {
	nftID: Buffer;
	recipientAddress: Buffer;
	data: string;
}

const INVALID_TRANSFER_RECIPIENTS = [POSITION_MANAGER_ADDRESS, ROUTER_ADDRESS];

export async function verifyValidTransfer(
	this: { stores: NamedRegistry; events: NamedRegistry },
	context: TransactionVerifyContext,
) {
	if (context.transaction.module === 'token' && context.transaction.command === 'transfer') {
		const { schema } = new TransferCommand(this.stores, this.events);
		const params = codec.decode<TransferTokenParams>(schema, context.transaction.params);

		if (INVALID_TRANSFER_RECIPIENTS.findIndex(t => t.equals(params.recipientAddress)) >= 0) {
			throw new Error(`Invalid token transfer recipient. Address already reserved by dex module`);
		}
	}

	if (context.transaction.module === 'nft' && context.transaction.command === 'transfer') {
		const params = codec.decode<TransferNFTParams>(
			nftTransferParamsSchema,
			context.transaction.params,
		);

		if (INVALID_TRANSFER_RECIPIENTS.findIndex(t => t.equals(params.recipientAddress)) >= 0) {
			throw new Error(`Invalid nft transfer recipient. Address already reserved by dex module`);
		}

		const poolStore = this.stores.get(PoolStore);
		if (await poolStore.has(context, params.recipientAddress)) {
			throw new Error(`Invalid nft transfer recipient. A dex pool can't receive any nft`);
		}
	}
}
