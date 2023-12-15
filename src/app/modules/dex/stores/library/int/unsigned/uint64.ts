import { BigIntAble, BigIntFactory, BigIntBase } from '../base';
import { maxUnsigned } from '../base/limit';

export type Uint64String = string;

export default class Uint64 extends BigIntBase {
	public static from(value: BigIntAble): Uint64 {
		return BigIntFactory.bind(this)(value, false, 64) as Uint64;
	}

	protected toBigNumber(value: bigint): this {
		return Uint64.from(value) as this;
	}

	static MAX = maxUnsigned[64];
	static MIN = '0';
}
