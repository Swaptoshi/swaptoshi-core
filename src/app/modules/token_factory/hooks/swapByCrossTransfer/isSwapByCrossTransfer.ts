/* eslint-disable import/no-cycle */
import { Modules, codec } from 'klayr-sdk';
import { crossChainTokenTransferMessageParams } from '../../schema';
import { TokenFactoryInteroperableMethod } from '../../cc_method';
import { ICOStore } from '../../stores/ico';

interface CrossChainTransferTokenParams {
	tokenID: Buffer;
	amount: bigint;
	senderAddress: Buffer;
	recipientAddress: Buffer;
	data: string;
}

export async function isSwapByCrossTransfer(this: TokenFactoryInteroperableMethod, ctx: Modules.Interoperability.CrossChainMessageContext) {
	if (ctx.ccm.module === 'token' && ctx.ccm.crossChainCommand === 'transferCrossChain' && ctx.ccm.status === 0) {
		const params = codec.decode<CrossChainTransferTokenParams>(crossChainTokenTransferMessageParams, ctx.ccm.params);

		const icoStore = this.stores.get(ICOStore);
		if (await icoStore.has(ctx.getMethodContext(), params.recipientAddress)) {
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
