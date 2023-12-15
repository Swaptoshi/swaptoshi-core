import { CreatePoolParams } from '../../../types';
import { verifyNumberString, verifyToken } from '../base';

export function verifyCreatePoolParam(params: CreatePoolParams) {
	verifyToken('tokenA', params.tokenA);
	verifyToken('tokenB', params.tokenB);
	verifyNumberString('fee', params.fee);
	verifyNumberString('sqrtPriceX96', params.sqrtPriceX96);
}
