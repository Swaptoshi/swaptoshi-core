import { QuoteExactInputParams } from '../../../types';
import { verifyNumberString, verifyString } from '../base';

export function verifyQuoteExactInputParam(params: QuoteExactInputParams) {
	verifyString('path', params.path);
	verifyNumberString('amountIn', params.amountIn);
}
