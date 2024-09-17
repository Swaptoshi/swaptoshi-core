/* eslint-disable import/no-cycle */
import { Modules, codec } from 'klayr-sdk';
import { POSITION_MANAGER_ADDRESS, ROUTER_ADDRESS } from '../../constants';
import { PoolStore } from '../../stores/pool';
import { crossChainNFTTransferMessageParamsSchema, crossChainTokenTransferMessageParams } from '../../schema';
import { DexInteroperableMethod } from '../../cc_method';

interface CrossChainTransferTokenParams {
	tokenID: Buffer;
	amount: bigint;
	senderAddress: Buffer;
	recipientAddress: Buffer;
	data: string;
}

interface TransferNFTParams {
	nftID: Buffer;
	senderAddress: Buffer;
	recipientAddress: Buffer;
	attributesArray: { module: string; attributes: Buffer }[];
	data: string;
}

const INVALID_TRANSFER_RECIPIENTS = [POSITION_MANAGER_ADDRESS, ROUTER_ADDRESS];

export async function verifyValidCrossTransfer(this: DexInteroperableMethod, context: Modules.Interoperability.CrossChainMessageContext) {
	if (context.ccm.module === 'token' && context.ccm.crossChainCommand === 'transferCrossChain') {
		const params = codec.decode<CrossChainTransferTokenParams>(crossChainTokenTransferMessageParams, context.ccm.params);

		if (INVALID_TRANSFER_RECIPIENTS.findIndex(t => t.equals(params.recipientAddress)) >= 0) {
			// throw new Error(`Invalid token transfer recipient. Address already reserved by dex module`);
			await this._tokenMethod?.transfer(context.getMethodContext(), params.recipientAddress, params.senderAddress, params.tokenID, params.amount);
		}
	}

	if (context.ccm.module === 'nft' && context.ccm.crossChainCommand === 'crossChainTransfer') {
		const params = codec.decode<TransferNFTParams>(crossChainNFTTransferMessageParamsSchema, context.ccm.params);

		if (INVALID_TRANSFER_RECIPIENTS.findIndex(t => t.equals(params.recipientAddress)) >= 0) {
			// throw new Error(`Invalid nft transfer recipient. Address already reserved by dex module`);
			await this._nftMethod?.transfer(context.getMethodContext(), params.recipientAddress, params.senderAddress, params.nftID);
		}

		const poolStore = this.stores.get(PoolStore);
		if (await poolStore.has(context, params.recipientAddress)) {
			// throw new Error(`Invalid nft transfer recipient. A dex pool can't receive any nft`);
			await this._nftMethod?.transfer(context.getMethodContext(), params.recipientAddress, params.senderAddress, params.nftID);
		}
	}
}
