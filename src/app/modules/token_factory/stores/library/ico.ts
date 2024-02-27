/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ICO_POOL_ADDRESS_SUFFIX, TOKEN_ID_LENGTH } from '../../constants';

export interface ICOPoolKey {
	tokenIn: Buffer;
	tokenOut: Buffer;
}

export const defaultICOPoolKey: ICOPoolKey = Object.freeze({
	tokenIn: Buffer.alloc(0),
	tokenOut: Buffer.alloc(0),
});

export function decodeICOPoolAddress(poolAddress: Buffer): ICOPoolKey {
	if (poolAddress.compare(Buffer.alloc(0)) === 0) throw new Error('zero');

	return {
		tokenIn: poolAddress.subarray(0, 8),
		tokenOut: poolAddress.subarray(8, 16),
	};
}

export function getICOPoolAddressSuffix() {
	if (ICO_POOL_ADDRESS_SUFFIX.length !== 4) {
		throw new Error('invalid ICO_POOL_ADDRESS_SUFFIX');
	}
	return ICO_POOL_ADDRESS_SUFFIX;
}

export function computeICOPoolAddress(key: ICOPoolKey): Buffer {
	if (key.tokenIn.length !== TOKEN_ID_LENGTH) {
		throw new Error('invalid tokenIn');
	}

	if (key.tokenOut.length !== TOKEN_ID_LENGTH) {
		throw new Error('invalid tokenOut');
	}

	if (key.tokenIn.compare(Buffer.alloc(8)) === 0 && key.tokenOut.compare(Buffer.alloc(8)) === 0) {
		throw new Error('zero');
	}

	if (key.tokenIn.compare(key.tokenOut) === 0) {
		throw new Error('same token address');
	}

	return Buffer.concat([key.tokenIn, key.tokenOut, getICOPoolAddressSuffix()]);
}
