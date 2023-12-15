import { BigIntAble, BigIntFactory, BigIntBase } from '../base';
import { maxSigned, minSigned } from '../base/limit';

export type Int256String = string;

export default class Int256 extends BigIntBase {
	public static from(value: BigIntAble): Int256 {
		return BigIntFactory.bind(this)(value, true, 256) as Int256;
	}

	protected toBigNumber(value: bigint): this {
		return Int256.from(value) as this;
	}

	static MAX = maxSigned[256];
	static MIN = minSigned[256];
}
