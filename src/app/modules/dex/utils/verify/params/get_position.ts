/* eslint-disable import/no-cycle */
import { GetPositionParams } from '../../../types';
import { verifyAddress, verifyNumberString } from '../base';

export function verifyGetPositionParam(params: GetPositionParams) {
	verifyAddress('poolAddress', Buffer.from(params.poolAddress, 'hex'));
	verifyNumberString('tokenId', params.tokenId);
}
