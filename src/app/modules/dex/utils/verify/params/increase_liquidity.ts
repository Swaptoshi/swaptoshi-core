import { IncreaseLiquidityParams } from '../../../types';
import { verifyAddress, verifyNumberString } from '../base';

export function verifyIncreaseLiquidityParam(params: IncreaseLiquidityParams) {
	verifyAddress('poolAddress', params.poolAddress);
	verifyNumberString('tokenId', params.tokenId);
	verifyNumberString('amount0Desired', params.amount0Desired);
	verifyNumberString('amount1Desired', params.amount1Desired);
	verifyNumberString('amount0Min', params.amount0Min);
	verifyNumberString('amount1Min', params.amount1Min);
	verifyNumberString('deadline', params.deadline);
}
