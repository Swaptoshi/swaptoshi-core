/* eslint-disable import/no-cycle */
import { QuoteExactOutputSingleParams } from '../../../types';
import { verifyNumberString, verifyToken } from '../base';

export function verifyQuoteExactOutputSingleParam(params: QuoteExactOutputSingleParams) {
	verifyToken('tokenIn', Buffer.from(params.tokenIn, 'hex'));
	verifyToken('tokenOut', Buffer.from(params.tokenOut, 'hex'));
	verifyNumberString('amount', params.amount);
	verifyNumberString('fee', params.fee);
	verifyNumberString('sqrtPriceLimitX96', params.sqrtPriceLimitX96);
}
