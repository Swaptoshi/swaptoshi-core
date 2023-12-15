import { BigIntAble, BigIntFactory, BigIntBase } from '../base';
import { maxUnsigned } from '../base/limit';

export type Uint32String = string;

export default class Uint32 extends BigIntBase {
	public static from(value: BigIntAble): Uint32 {
		return BigIntFactory.bind(this)(value, false, 32) as Uint32;
	}

	protected toBigNumber(value: bigint): this {
		return Uint32.from(value) as this;
	}

	static MAX = maxUnsigned[32];
	static MIN = '0';
}
