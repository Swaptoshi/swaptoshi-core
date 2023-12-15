import { BigIntAble, BigIntFactory, BigIntBase } from '../base';
import { maxUnsigned } from '../base/limit';

export type Uint24String = string;

export default class Uint24 extends BigIntBase {
	public static from(value: BigIntAble): Uint24 {
		return BigIntFactory.bind(this)(value, false, 24) as Uint24;
	}

	protected toBigNumber(value: bigint): this {
		return Uint24.from(value) as this;
	}

	static MAX = maxUnsigned[24];
	static MIN = '0';
}
