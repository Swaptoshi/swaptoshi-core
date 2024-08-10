/* eslint-disable import/no-cycle */
import { DecreaseLiquidityParams } from '../../../types';
import { verifyAddress, verifyNumberString } from '../base';

export function verifyDecreaseLiquidityParam(params: DecreaseLiquidityParams) {
	verifyAddress('poolAddress', params.poolAddress);
	verifyNumberString('tokenId', params.tokenId);
	verifyNumberString('liquidity', params.liquidity);
	verifyNumberString('amount0Min', params.amount0Min);
	verifyNumberString('amount1Min', params.amount1Min);
	verifyNumberString('deadline', params.deadline);
}
