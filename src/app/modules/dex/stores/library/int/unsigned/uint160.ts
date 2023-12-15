import { BigIntAble, BigIntFactory, BigIntBase } from '../base';
import { maxUnsigned } from '../base/limit';

export type Uint160String = string;

export default class Uint160 extends BigIntBase {
	public static from(value: BigIntAble): Uint160 {
		return BigIntFactory.bind(this)(value, false, 160) as Uint160;
	}

	protected toBigNumber(value: bigint): this {
		return Uint160.from(value) as this;
	}

	static MAX = maxUnsigned[160];
	static MIN = '0';
}
