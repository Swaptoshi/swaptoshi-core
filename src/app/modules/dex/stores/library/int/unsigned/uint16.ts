import { BigIntAble, BigIntFactory, BigIntBase } from '../base';
import { maxUnsigned } from '../base/limit';

export type Uint16String = string;

export default class Uint16 extends BigIntBase {
	public static from(value: BigIntAble): Uint16 {
		return BigIntFactory.bind(this)(value, false, 16) as Uint16;
	}

	protected toBigNumber(value: bigint): this {
		return Uint16.from(value) as this;
	}

	static MAX = maxUnsigned[16];
	static MIN = '0';
}
