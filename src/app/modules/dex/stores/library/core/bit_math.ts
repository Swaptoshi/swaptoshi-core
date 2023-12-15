/* eslint-disable no-bitwise */
import { Uint256String, Uint8String, Uint128, Uint64, Uint32, Uint16, Uint8 } from '../int';

export function mostSignificantBit(value: Uint256String): Uint8String {
	let x = BigInt(value);

	if (x <= BigInt(0)) {
		throw new Error('value must be greater than 0');
	}

	let r = 0;

	if (x >= BigInt('0x100000000000000000000000000000000')) {
		x >>= BigInt(128);
		r += 128;
	}
	if (x >= BigInt('0x10000000000000000')) {
		x >>= BigInt(64);
		r += 64;
	}
	if (x >= BigInt('0x100000000')) {
		x >>= BigInt(32);
		r += 32;
	}
	if (x >= BigInt('0x10000')) {
		x >>= BigInt(16);
		r += 16;
	}
	if (x >= BigInt('0x100')) {
		x >>= BigInt(8);
		r += 8;
	}
	if (x >= BigInt('0x10')) {
		x >>= BigInt(4);
		r += 4;
	}
	if (x >= BigInt('0x4')) {
		x >>= BigInt(2);
		r += 2;
	}
	if (x >= BigInt('0x2')) {
		r += 1;
	}

	return r.toString();
}

export function leastSignificantBit(value: Uint256String): Uint8String {
	let x = BigInt(value);

	if (x <= BigInt(0)) {
		throw new Error('value must be greater than 0');
	}

	let r = 255;

	if ((x & BigInt(Uint128.MAX)) > BigInt(0)) {
		r -= 128;
	} else {
		x >>= BigInt(128);
	}

	if ((x & BigInt(Uint64.MAX)) > BigInt(0)) {
		r -= 64;
	} else {
		x >>= BigInt(64);
	}

	if ((x & BigInt(Uint32.MAX)) > BigInt(0)) {
		r -= 32;
	} else {
		x >>= BigInt(32);
	}

	if ((x & BigInt(Uint16.MAX)) > BigInt(0)) {
		r -= 16;
	} else {
		x >>= BigInt(16);
	}

	if ((x & BigInt(Uint8.MAX)) > BigInt(0)) {
		r -= 8;
	} else {
		x >>= BigInt(8);
	}

	if ((x & BigInt(15)) > BigInt(0)) {
		r -= 4;
	} else {
		x >>= BigInt(4);
	}

	if ((x & BigInt(3)) > BigInt(0)) {
		r -= 2;
	} else {
		x >>= BigInt(2);
	}

	if ((x & BigInt(1)) > BigInt(0)) {
		r -= 1;
	}

	return r.toString();
}
