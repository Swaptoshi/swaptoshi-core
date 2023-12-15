import { BigIntAble, BigIntFactory, BigIntBase } from '../base';

export type UintString = string;

export default class Uint extends BigIntBase {
	public static from(value: BigIntAble): Uint {
		return BigIntFactory.bind(this)(value, false, 0) as Uint;
	}

	protected toBigNumber(value: bigint): this {
		return Uint.from(value) as this;
	}
}
