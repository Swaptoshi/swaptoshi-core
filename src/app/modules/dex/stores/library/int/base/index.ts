/* eslint-disable no-bitwise */
import { maxSigned, maxUnsigned, minSigned } from './limit';

const _warnedToUnboundBitwise = false;

export type BigIntAble = BigIntBase | string | number | bigint;
export type BigNumberish = BigIntBase | bigint | string | number;
export const _constructorGuard = {};

export function BigIntFactory<T extends BigIntBase>(
	this: typeof BigIntBase,
	value: BigIntAble,
	signed: boolean,
	bitSize: number,
): T {
	if (value instanceof this) {
		return value as T;
	}

	if ((value as unknown as BigIntBase)._value !== undefined) {
		return new this(
			_constructorGuard,
			(value as unknown as BigIntBase)._value,
			signed,
			bitSize,
		) as T;
	}

	return new this(_constructorGuard, BigInt(value), signed, bitSize) as T;
}

export class BigIntBase {
	public constructor(constructorGuard: unknown, value: bigint, signed: boolean, bitSize: number) {
		if (constructorGuard !== _constructorGuard) {
			throw new Error(`cannot call constructor directly`);
		}

		this._value = value;
		this.setup(signed, bitSize);

		if (this.max !== '' && this._value > BigInt(this.max)) {
			throw new Error(`value ${this.toString()} exceeds ${this.name} maximum value of ${this.max}`);
		}

		if (this.min !== '' && this._value < BigInt(this.min)) {
			throw new Error(`value ${this.toString()} exceeds ${this.name} minimum value of ${this.min}`);
		}

		Object.freeze(this);
	}

	public static from(value: BigIntAble): BigIntBase {
		return BigIntFactory.bind(this)(value, false, 0);
	}

	public abs(): this {
		if (this._value < BigInt(0)) {
			return this.toBigNumber(this._value * BigInt(-1));
		}
		return this;
	}

	public add(other: BigNumberish): this {
		return this.toBigNumber(this.hof(this._value + BigInt(other.toString())));
	}

	public sub(other: BigNumberish): this {
		return this.toBigNumber(this.hof(this._value - BigInt(other.toString())));
	}

	public div(other: BigNumberish): this {
		const o = BigInt(other.toString());
		if (o === BigInt(0)) {
			throw new Error('div: division-by-zero');
		}
		return this.toBigNumber(this.hof(this._value / o));
	}

	public mul(other: BigNumberish): this {
		return this.toBigNumber(this.hof(this._value * BigInt(other.toString())));
	}

	public mod(other: BigNumberish): this {
		const value = BigInt(other.toString());
		if (value === BigInt(0)) {
			throw new Error('mod: division-by-zero');
		}
		return this.toBigNumber(this.hof(((this._value % value) + value) % value));
	}

	public pow(other: BigNumberish): this {
		const value = BigInt(other.toString());
		if (value < BigInt(0)) {
			throw new Error('pow: negative-power');
		}
		return this.toBigNumber(this.hof(this._value ** value));
	}

	public and(other: BigNumberish): this {
		const value = BigInt(other.toString());
		if (_warnedToUnboundBitwise && (this.isNegative() || value < BigInt(0))) {
			console.warn(`unbound-bitwise-result (and): negative value`);
		}
		return this.toBigNumber(this.hof(this._value & value));
	}

	public not(): this {
		return this.toBigNumber(this.hof(~this._value));
	}

	public or(other: BigNumberish): this {
		const value = BigInt(other.toString());
		if (_warnedToUnboundBitwise && (this.isNegative() || value < BigInt(0))) {
			console.warn(`unbound-bitwise-result (or): negative value`);
		}
		return this.toBigNumber(this.hof(this._value | value));
	}

	public xor(other: BigNumberish): this {
		const value = BigInt(other.toString());
		if (_warnedToUnboundBitwise && (this.isNegative() || value < BigInt(0))) {
			console.warn(`unbound-bitwise-result (xor): negative value`);
		}
		return this.toBigNumber(this.hof(this._value ^ value));
	}

	public shl(value: BigNumberish): this {
		return this.toBigNumber(this.hof(this._value << BigInt(value.toString())));
	}

	public shr(value: BigNumberish): this {
		return this.toBigNumber(this.hof(this._value >> BigInt(value.toString())));
	}

	public eq(other: BigNumberish): boolean {
		return this._value === BigInt(other.toString());
	}

	public neq(other: BigNumberish): boolean {
		return this._value !== BigInt(other.toString());
	}

	public lt(other: BigNumberish): boolean {
		return this._value < BigInt(other.toString());
	}

	public lte(other: BigNumberish): boolean {
		return this._value <= BigInt(other.toString());
	}

	public gt(other: BigNumberish): boolean {
		return this._value > BigInt(other.toString());
	}

	public gte(other: BigNumberish): boolean {
		return this._value >= BigInt(other.toString());
	}

	public isNegative(): boolean {
		return this._value < BigInt(0);
	}

	public isZero(): boolean {
		return this._value === BigInt(0);
	}

	public toNumber(): number {
		try {
			return Number(this._value);
		} catch (error) {
			throw new Error('toNumber: overflow');
		}
	}

	public toBigInt(): bigint {
		return this._value;
	}

	public toString(): string {
		return this._value.toString(10);
	}

	public toHexString(): string {
		return this.isNegative()
			? this._value.toString(16).replace('-', '-0x')
			: `0x${this._value.toString(16)}`;
	}

	public toJSON(): Record<'type' | 'hex', string> {
		return { type: 'BigNumber', hex: this.toHexString() };
	}

	protected toBigNumber(value: bigint): this {
		return BigIntBase.from(value) as this;
	}

	private setup(signed: boolean, bitSize: number) {
		let className = signed ? 'Int' : 'Uint';
		className = bitSize > 0 ? `${className}${bitSize}` : className;

		if (bitSize > 0) {
			this.name = `${signed ? '' : 'u'}int${bitSize}`;
			this.max = (signed ? maxSigned[bitSize] : maxUnsigned[bitSize]) as string;
			this.min = (signed ? minSigned[bitSize] : '0') as string;
		}
	}

	// handle overflow
	private hof(value: bigint): bigint {
		if (this.max === '' || this.min === '') return value;

		let result = value;
		if (value < BigInt(this.min) || value > BigInt(this.max)) {
			const range = BigInt(this.max) - BigInt(this.min) + BigInt(1);
			result = ((((value - BigInt(this.min)) % range) + range) % range) + BigInt(this.min);
		}

		return result;
	}

	static MAX = 'Infinity';
	static MIN = 'Infinity';

	private name: string = '';
	private max: string = '';
	private min: string = '';

	readonly _value: bigint;
}
