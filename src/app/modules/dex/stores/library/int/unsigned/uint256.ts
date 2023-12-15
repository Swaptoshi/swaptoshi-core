import { BigIntAble, BigIntFactory, BigIntBase } from '../base';
import { maxUnsigned } from '../base/limit';

export type Uint256String = string;

export default class Uint256 extends BigIntBase {
	public static from(value: BigIntAble): Uint256 {
		return BigIntFactory.bind(this)(value, false, 256) as Uint256;
	}

	protected toBigNumber(value: bigint): this {
		return Uint256.from(value) as this;
	}

	static MAX = maxUnsigned[256];
	static MIN = '0';
}
