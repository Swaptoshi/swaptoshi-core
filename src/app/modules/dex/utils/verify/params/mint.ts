/* eslint-disable import/no-cycle */
import { MintParams } from '../../../types';
import { verifyAddress, verifyNumberString, verifyToken } from '../base';

export function verifyMintParam(params: MintParams) {
	verifyToken('token0', params.token0);
	verifyToken('token1', params.token1);
	verifyNumberString('fee', params.fee);
	verifyNumberString('tickLower', params.tickLower);
	verifyNumberString('tickUpper', params.tickUpper);
	verifyNumberString('amount0Desired', params.amount0Desired);
	verifyNumberString('amount1Desired', params.amount1Desired);
	verifyNumberString('amount0Min', params.amount0Min);
	verifyNumberString('amount1Min', params.amount1Min);
	verifyAddress('recipient', params.recipient);
	verifyNumberString('deadline', params.deadline);
}
