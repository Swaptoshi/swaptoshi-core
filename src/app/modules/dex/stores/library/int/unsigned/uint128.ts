import { BigIntAble, BigIntFactory, BigIntBase } from '../base';
import { maxUnsigned } from '../base/limit';

export type Uint128String = string;

export default class Uint128 extends BigIntBase {
	public static from(value: BigIntAble): Uint128 {
		return BigIntFactory.bind(this)(value, false, 128) as Uint128;
	}

	protected toBigNumber(value: bigint): this {
		return Uint128.from(value) as this;
	}

	static MAX = maxUnsigned[128];
	static MIN = '0';
}
