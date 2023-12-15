import { ExactOutputSingleParams } from '../../../types';
import { verifyAddress, verifyNumberString, verifyToken } from '../base';

export function verifyExactOutputSingleParam(params: ExactOutputSingleParams) {
	verifyToken('tokenIn', params.tokenIn);
	verifyToken('tokenOut', params.tokenOut);
	verifyNumberString('fee', params.fee);
	verifyAddress('recipient', params.recipient);
	verifyNumberString('deadline', params.deadline);
	verifyNumberString('amountOut', params.amountOut);
	verifyNumberString('amountInMaximum', params.amountInMaximum);
	verifyNumberString('sqrtPriceLimitX96', params.sqrtPriceLimitX96);
}
