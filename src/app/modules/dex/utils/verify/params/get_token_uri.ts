/* eslint-disable import/no-cycle */
import { GetTokenURIParams } from '../../../types';
import { verifyKlayer32Address, verifyNumberString } from '../base';

export function verifyGetTokenURIParam(params: GetTokenURIParams) {
	verifyKlayer32Address('poolAddress', params.poolAddress);
	verifyNumberString('tokenId', params.tokenId);
}
