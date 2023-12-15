import { BigIntAble, BigIntFactory, BigIntBase } from '../base';
import { maxUnsigned } from '../base/limit';

export type Uint8String = string;

export default class Uint8 extends BigIntBase {
	public static from(value: BigIntAble): Uint8 {
		return BigIntFactory.bind(this)(value, false, 8) as Uint8;
	}

	protected toBigNumber(value: bigint): this {
		return Uint8.from(value) as this;
	}

	static MAX = maxUnsigned[8];
	static MIN = '0';
}
