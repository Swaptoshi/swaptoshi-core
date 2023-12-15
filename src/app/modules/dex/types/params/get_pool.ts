import { Uint24String } from '../../stores/library/int';

export interface GetPoolParams {
	tokenA: string;
	tokenB: string;
	fee: Uint24String;
}
