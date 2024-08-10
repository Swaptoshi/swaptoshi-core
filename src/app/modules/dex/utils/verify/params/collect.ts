/* eslint-disable import/no-cycle */
import { CollectParams } from '../../../types';
import { verifyAddress, verifyNumberString } from '../base';

export function verifyCollectParam(params: CollectParams) {
	verifyAddress('poolAddress', params.poolAddress);
	verifyNumberString('tokenId', params.tokenId);
	verifyAddress('recipient', params.recipient);
	verifyNumberString('amount0Max', params.amount0Max);
	verifyNumberString('amount1Max', params.amount1Max);
}
