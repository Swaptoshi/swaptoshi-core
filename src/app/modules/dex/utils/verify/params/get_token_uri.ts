import { GetTokenURIParams } from '../../../types';
import { verifyAddress, verifyNumberString } from '../base';

export function verifyGetTokenURIParam(params: GetTokenURIParams) {
	verifyAddress('poolAddress', Buffer.from(params.poolAddress, 'hex'));
	verifyNumberString('tokenId', params.tokenId);
}
