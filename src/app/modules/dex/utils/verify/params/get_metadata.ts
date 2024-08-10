/* eslint-disable import/no-cycle */
import { GetMetadataParams } from '../../../types';
import { verifyAddress, verifyNumberString } from '../base';

export function verifyGetMetadataParam(params: GetMetadataParams) {
	verifyAddress('poolAddress', Buffer.from(params.poolAddress, 'hex'));
	verifyNumberString('tokenId', params.tokenId);
}
