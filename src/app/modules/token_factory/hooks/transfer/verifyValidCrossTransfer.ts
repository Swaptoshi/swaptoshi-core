/* eslint-disable import/no-cycle */
import { Modules, codec } from 'klayr-sdk';
import { crossChainNFTTransferMessageParamsSchema } from '../../schema';
import { TokenFactoryInteroperableMethod } from '../../cc_method';
import { ICOStore } from '../../stores/ico';

interface TransferNFTParams {
	nftID: Buffer;
	senderAddress: Buffer;
	recipientAddress: Buffer;
	attributesArray: { module: string; attributes: Buffer }[];
	data: string;
}

export async function verifyValidCrossTransfer(this: TokenFactoryInteroperableMethod, context: Modules.Interoperability.CrossChainMessageContext) {
	if (context.ccm.module === 'nft' && context.ccm.crossChainCommand === 'crossChainTransfer') {
		const params = codec.decode<TransferNFTParams>(crossChainNFTTransferMessageParamsSchema, context.ccm.params);

		const icoStore = this.stores.get(ICOStore);
		if (await icoStore.has(context, params.recipientAddress)) {
			// throw new Error(`Invalid nft transfer recipient. An ICO pool can't receive any nft`);
			await this._nftMethod?.transfer(context.getMethodContext(), params.recipientAddress, params.senderAddress, params.nftID);
		}
	}
}
