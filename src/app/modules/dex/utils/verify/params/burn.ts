import { BurnParams } from '../../../types';
import { verifyAddress, verifyNumberString } from '../base';

export function verifyBurnParam(params: BurnParams) {
	verifyAddress('poolAddress', params.poolAddress);
	verifyNumberString('tokenId', params.tokenId);
}
