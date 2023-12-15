import { ExactInputSingleParams } from '../../../types';
import { verifyAddress, verifyNumberString, verifyToken } from '../base';

export function verifyExactInputSingleParam(params: ExactInputSingleParams) {
	verifyToken('tokenIn', params.tokenIn);
	verifyToken('tokenOut', params.tokenOut);
	verifyNumberString('fee', params.fee);
	verifyAddress('recipient', params.recipient);
	verifyNumberString('deadline', params.deadline);
	verifyNumberString('amountIn', params.amountIn);
	verifyNumberString('amountOutMinimum', params.amountOutMinimum);
	verifyNumberString('sqrtPriceLimitX96', params.sqrtPriceLimitX96);
}
