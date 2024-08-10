/* eslint-disable import/no-cycle */
import { CollectTreasuryParams } from '../../../types';
import { verifyAddress, verifyNumberString } from '../base';

export function verifyCollectTreasuryParam(params: CollectTreasuryParams) {
	verifyAddress('poolAddress', params.poolAddress);
	verifyNumberString('tokenId', params.tokenId);
}
