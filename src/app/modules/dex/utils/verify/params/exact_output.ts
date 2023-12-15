import { ExactOutputParams } from '../../../types';
import { verifyAddress, verifyNumberString } from '../base';

export function verifyExactOutputParam(params: ExactOutputParams) {
	verifyAddress('recipient', params.recipient);
	verifyNumberString('deadline', params.deadline);
	verifyNumberString('amountOut', params.amountOut);
	verifyNumberString('amountInMaximum', params.amountInMaximum);
}
