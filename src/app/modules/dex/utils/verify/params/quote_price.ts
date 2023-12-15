import { QuotePriceParams } from '../../../types';
import { verifyString } from '../base';

export function verifyPriceParam(params: QuotePriceParams) {
	verifyString('path', params.path);
}
