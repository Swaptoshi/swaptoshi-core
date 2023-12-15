import { QuoteExactOutputParams } from '../../../types';
import { verifyNumberString, verifyString } from '../base';

export function verifyQuoteExactOutputParam(params: QuoteExactOutputParams) {
	verifyString('path', params.path);
	verifyNumberString('amountOut', params.amountOut);
}
