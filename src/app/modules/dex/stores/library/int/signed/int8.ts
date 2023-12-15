import { BigIntAble, BigIntFactory, BigIntBase } from '../base';
import { maxSigned, minSigned } from '../base/limit';

export type Int8String = string;

export default class Int8 extends BigIntBase {
	public static from(value: BigIntAble): Int8 {
		return BigIntFactory.bind(this)(value, true, 8) as Int8;
	}

	protected toBigNumber(value: bigint): this {
		return Int8.from(value) as this;
	}

	static MAX = maxSigned[8];
	static MIN = minSigned[8];
}
