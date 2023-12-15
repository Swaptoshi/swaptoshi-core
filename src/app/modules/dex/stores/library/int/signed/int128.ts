import { BigIntAble, BigIntFactory, BigIntBase } from '../base';
import { maxSigned, minSigned } from '../base/limit';

export type Int128String = string;

export default class Int128 extends BigIntBase {
	public static from(value: BigIntAble): Int128 {
		return BigIntFactory.bind(this)(value, true, 128) as Int128;
	}

	protected toBigNumber(value: bigint): this {
		return Int128.from(value) as this;
	}

	static MAX = maxSigned[128];
	static MIN = minSigned[128];
}
