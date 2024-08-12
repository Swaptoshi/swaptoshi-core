/* eslint-disable import/no-cycle */
import { GetMetadataParams } from '../../../types';
import { verifyKlayer32Address, verifyNumberString } from '../base';

export function verifyGetMetadataParam(params: GetMetadataParams) {
	verifyKlayer32Address('poolAddress', params.poolAddress);
	verifyNumberString('tokenId', params.tokenId);
}
