/* eslint-disable import/no-cycle */
import { Int24String } from '../int';
import * as Position from '../core/position';

export function compute(owner: Buffer, tickLower: Int24String, tickUpper: Int24String) {
	return Position.positionKey(owner, tickLower, tickUpper);
}

export function getNFTId(chainId: Buffer, collectionId: Buffer, tokenId: string | bigint) {
	if (chainId.length !== 4) throw new Error('invalid chainId');
	if (collectionId.length !== 4) throw new Error('invalid collectionId');

	const tokenIdBuf = Buffer.allocUnsafe(8);
	tokenIdBuf.writeBigInt64BE(BigInt(tokenId));
	return Buffer.concat([chainId, collectionId, tokenIdBuf]);
}

export function decodeNFTId(nftId: Buffer) {
	return {
		chainId: nftId.subarray(0, 4),
		collectionId: nftId.subarray(4, 8),
		index: nftId.subarray(8).readBigUInt64BE(),
	};
}
