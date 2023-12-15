import { BigIntAble, BigIntFactory, BigIntBase } from '../base';
import { maxUnsigned } from '../base/limit';

export type Uint80String = string;

export default class Uint80 extends BigIntBase {
	public static from(value: BigIntAble): Uint80 {
		return BigIntFactory.bind(this)(value, false, 80) as Uint80;
	}

	protected toBigNumber(value: bigint): this {
		return Uint80.from(value) as this;
	}

	static MAX = maxUnsigned[80];
	static MIN = '0';
}
