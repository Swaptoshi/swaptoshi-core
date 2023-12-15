import { BigIntAble, BigIntFactory, BigIntBase } from '../base';
import { maxUnsigned } from '../base/limit';

export type Uint96String = string;

export default class Uint96 extends BigIntBase {
	public static from(value: BigIntAble): Uint96 {
		return BigIntFactory.bind(this)(value, false, 96) as Uint96;
	}

	protected toBigNumber(value: bigint): this {
		return Uint96.from(value) as this;
	}

	static MAX = maxUnsigned[96];
	static MIN = '0';
}
