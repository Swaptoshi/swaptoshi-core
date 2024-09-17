/* eslint-disable import/no-cycle */
import { Modules, StateMachine, codec } from 'klayr-sdk';
import { nftTransferParamsSchema } from '../../schema';
import { ICOStore } from '../../stores/ico';

interface TransferNFTParams {
	nftID: Buffer;
	recipientAddress: Buffer;
	data: string;
}

export async function verifyValidTransfer(this: { stores: Modules.NamedRegistry; events: Modules.NamedRegistry }, context: StateMachine.TransactionVerifyContext) {
	if (context.transaction.module === 'nft' && context.transaction.command === 'transfer') {
		const params = codec.decode<TransferNFTParams>(nftTransferParamsSchema, context.transaction.params);

		const icoStore = this.stores.get(ICOStore);
		if (await icoStore.has(context, params.recipientAddress)) {
			throw new Error(`Invalid nft transfer recipient. An ICO pool can't receive any nft`);
		}
	}
}
