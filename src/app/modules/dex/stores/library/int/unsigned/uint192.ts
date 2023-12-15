import { BigIntAble, BigIntFactory, BigIntBase } from '../base';
import { maxUnsigned } from '../base/limit';

export type Uint192String = string;

export default class Uint192 extends BigIntBase {
	public static from(value: BigIntAble): Uint192 {
		return BigIntFactory.bind(this)(value, false, 192) as Uint192;
	}

	protected toBigNumber(value: bigint): this {
		return Uint192.from(value) as this;
	}

	static MAX = maxUnsigned[192];
	static MIN = '0';
}
