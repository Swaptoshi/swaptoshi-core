/* eslint-disable import/no-cycle */
import { QuoteExactInputSingleParams } from '../../../types';
import { verifyNumberString, verifyToken } from '../base';

export function verifyQuoteExactInputSingleParam(params: QuoteExactInputSingleParams) {
	verifyToken('tokenIn', Buffer.from(params.tokenIn, 'hex'));
	verifyToken('tokenOut', Buffer.from(params.tokenOut, 'hex'));
	verifyNumberString('amountIn', params.amountIn);
	verifyNumberString('fee', params.fee);
	verifyNumberString('sqrtPriceLimitX96', params.sqrtPriceLimitX96);
}
