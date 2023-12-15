import { BigIntAble, BigIntFactory, BigIntBase } from '../base';
import { maxSigned, minSigned } from '../base/limit';

export type Int56String = string;

export default class Int56 extends BigIntBase {
	public static from(value: BigIntAble): Int56 {
		return BigIntFactory.bind(this)(value, true, 56) as Int56;
	}

	protected toBigNumber(value: bigint): this {
		return Int56.from(value) as this;
	}

	static MAX = maxSigned[56];
	static MIN = minSigned[56];
}
