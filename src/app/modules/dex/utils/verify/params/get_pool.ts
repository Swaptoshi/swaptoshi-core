/* eslint-disable import/no-cycle */
import { GetPoolParams } from '../../../types';
import { verifyNumberString, verifyToken } from '../base';

export function verifyGetPoolParam(params: GetPoolParams) {
	verifyToken('tokenA', Buffer.from(params.tokenA, 'hex'));
	verifyToken('tokenB', Buffer.from(params.tokenB, 'hex'));
	verifyNumberString('fee', params.fee);
}
