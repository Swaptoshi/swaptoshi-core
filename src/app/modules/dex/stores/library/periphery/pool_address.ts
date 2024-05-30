/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { cryptography } from 'klayr-sdk';
import { Uint24String } from '../int';

export interface PoolKey {
	token0: Buffer;
	token1: Buffer;
	fee: Uint24String;
}

export const defaultPoolKey: PoolKey = Object.freeze({
	token0: Buffer.alloc(0),
	token1: Buffer.alloc(0),
	fee: '0',
});

export function getPoolKey(tokenA: Buffer, tokenB: Buffer, fee: Uint24String): PoolKey {
	if (tokenA.compare(tokenB) === 0) throw new Error('same token address');

	const token0 = tokenA.compare(tokenB) < 0 ? tokenA : tokenB;
	const token1 = tokenA.compare(tokenB) < 0 ? tokenB : tokenA;
	return { token0, token1, fee };
}

export function decodePoolAddress(poolAddress: Buffer): PoolKey {
	return {
		token0: poolAddress.subarray(0, 8),
		token1: poolAddress.subarray(8, 16),
		fee: poolAddress.subarray(16).readUIntBE(0, 4).toString(),
	};
}

export function computeAddress(key: PoolKey): Buffer {
	if (
		key.token0.compare(Buffer.alloc(8)) === 0 &&
		key.token1.compare(Buffer.alloc(8)) === 0 &&
		key.fee === '0'
	) {
		throw new Error('zero');
	}

	if (key.token0.compare(key.token1) > 0) {
		throw new Error('invalid token0/token1');
	}

	if (key.token0.compare(Buffer.alloc(0)) === 0) {
		throw new Error('invalid token0');
	}

	const feeBuf = Buffer.allocUnsafe(4);
	feeBuf.writeUIntBE(parseInt(key.fee, 10), 0, 4);
	return Buffer.concat([key.token0, key.token1, feeBuf]);
}

export function computePoolId(poolAddress: Buffer): Buffer {
	if (poolAddress.length !== 20) throw new Error('invalid poolAddress');
	return cryptography.utils.hash(poolAddress).subarray(0, 4);
}
