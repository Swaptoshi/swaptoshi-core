/* eslint-disable import/no-cycle */
import { CrossChainMessageContext, codec } from 'lisk-sdk';
import { PoolStore } from '../../stores/pool';
import { crossChainTokenTransferMessageParams } from '../../schema/dependencies/token';
import { DexInteroperableMethod } from '../../cc_method';

interface CrossChainTransferTokenParams {
	tokenID: Buffer;
	amount: bigint;
	senderAddress: Buffer;
	recipientAddress: Buffer;
	data: string;
}

export async function isSwapByCrossTransfer(
	this: DexInteroperableMethod,
	ctx: CrossChainMessageContext,
) {
	if (
		ctx.ccm.module === 'token' &&
		ctx.ccm.crossChainCommand === 'transferCrossChain' &&
		ctx.ccm.status === 0
	) {
		const params = codec.decode<CrossChainTransferTokenParams>(
			crossChainTokenTransferMessageParams,
			ctx.ccm.params,
		);

		const poolStore = this.stores.get(PoolStore);
		if (await poolStore.has(ctx.getMethodContext(), params.recipientAddress)) {
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
