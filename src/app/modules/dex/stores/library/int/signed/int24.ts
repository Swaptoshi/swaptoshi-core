import { BigIntAble, BigIntFactory, BigIntBase } from '../base';
import { maxSigned, minSigned } from '../base/limit';

export type Int24String = string;

export default class Int24 extends BigIntBase {
	public static from(value: BigIntAble): Int24 {
		return BigIntFactory.bind(this)(value, true, 24) as Int24;
	}

	protected toBigNumber(value: bigint): this {
		return Int24.from(value) as this;
	}

	static MAX = maxSigned[24];
	static MIN = minSigned[24];
}
