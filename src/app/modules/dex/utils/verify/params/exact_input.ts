import { ExactInputParams } from '../../../types';
import { verifyAddress, verifyNumberString } from '../base';

export function verifyExactInputParam(params: ExactInputParams) {
	verifyAddress('recipient', params.recipient);
	verifyNumberString('deadline', params.deadline);
	verifyNumberString('amountIn', params.amountIn);
	verifyNumberString('amountOutMinimum', params.amountOutMinimum);
}
