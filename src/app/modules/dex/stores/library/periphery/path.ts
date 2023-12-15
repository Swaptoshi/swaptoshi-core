import { Uint256String, Uint256, Uint24String } from '../int';

import { toAddress, toUint24, slice } from './bytes_lib';

export const ADDR_SIZE = 8;
export const FEE_SIZE = 3;

export const NEXT_OFFSET = ADDR_SIZE + FEE_SIZE;
export const POP_OFFSET = NEXT_OFFSET + ADDR_SIZE;
export const MULTIPLE_POOLS_MIN_LENGTH = POP_OFFSET + NEXT_OFFSET;

export function hasMultiplePools(path: Buffer): boolean {
	return path.length >= MULTIPLE_POOLS_MIN_LENGTH;
}

export function numPools(path: Buffer): Uint256String {
	return Uint256.from(path.length).sub(ADDR_SIZE).div(NEXT_OFFSET).toString();
}

export function decodeFirstPool(path: Buffer): [tokenA: Buffer, tokenB: Buffer, fee: Uint24String] {
	return [toAddress(path, 0), toAddress(path, NEXT_OFFSET), toUint24(path, ADDR_SIZE).toString()];
}

export function getFirstPool(path: Buffer): Buffer {
	return path.subarray(0, POP_OFFSET);
}

export function skipToken(path: Buffer): Buffer {
	return slice(path, NEXT_OFFSET, path.length - NEXT_OFFSET);
}
