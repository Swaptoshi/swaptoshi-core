import { BigIntAble, BigIntFactory, BigIntBase } from '../base';
import { maxUnsigned } from '../base/limit';

export type Uint176String = string;

export default class Uint176 extends BigIntBase {
	public static from(value: BigIntAble): Uint176 {
		return BigIntFactory.bind(this)(value, false, 176) as Uint176;
	}

	protected toBigNumber(value: bigint): this {
		return Uint176.from(value) as this;
	}

	static MAX = maxUnsigned[176];
	static MIN = '0';
}
