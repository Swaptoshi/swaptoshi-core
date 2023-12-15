import { Uint160String, Uint24String } from '../../stores/library/int';

export interface CreatePoolParams {
	tokenA: Buffer;
	tokenASymbol: string;
	tokenADecimal: number;
	tokenB: Buffer;
	tokenBSymbol: string;
	tokenBDecimal: number;
	fee: Uint24String;
	sqrtPriceX96: Uint160String;
}
