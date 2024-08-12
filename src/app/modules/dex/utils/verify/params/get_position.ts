/* eslint-disable import/no-cycle */
import { GetPositionParams } from '../../../types';
import { verifyKlayer32Address, verifyNumberString } from '../base';

export function verifyGetPositionParam(params: GetPositionParams) {
	verifyKlayer32Address('poolAddress', params.poolAddress);
	verifyNumberString('tokenId', params.tokenId);
}
