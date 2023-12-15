import { BigIntAble, BigIntFactory, BigIntBase } from '../base';
import { maxSigned, minSigned } from '../base/limit';

export type Int16String = string;

export default class Int16 extends BigIntBase {
	public static from(value: BigIntAble): Int16 {
		return BigIntFactory.bind(this)(value, true, 16) as Int16;
	}

	protected toBigNumber(value: bigint): this {
		return Int16.from(value) as this;
	}

	static MAX = maxSigned[16];
	static MIN = minSigned[16];
}
