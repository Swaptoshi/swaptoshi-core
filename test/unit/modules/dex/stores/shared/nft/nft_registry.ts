/* eslint-disable import/no-cycle */
import { chainID } from '../module';
import { NFT } from './nft';

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class NFTRegistry {
	public static createToken(address: Buffer, collectionId: Buffer, token: NFT) {
		const id = NFTRegistry.nextAvailableId.get(collectionId.toString('hex')) ?? BigInt(0);
		const tokenIdBuf = Buffer.allocUnsafe(8);
		tokenIdBuf.writeBigInt64BE(BigInt(id));
		const nftId = Buffer.concat([chainID, collectionId, tokenIdBuf]);

		NFTRegistry.instance.delete(nftId.toString('hex'));
		NFTRegistry.instance.set(nftId.toString('hex'), token);

		NFTRegistry.nextAvailableId.set(collectionId.toString('hex'), id + BigInt(1));

		NFTRegistry.balanceOf.set(
			address.toString('hex'),
			(parseInt(NFTRegistry.balanceOf.get(address.toString('hex')) ?? '0', 10) + 1).toString(),
		);
	}

	public static reset() {
		NFTRegistry.instance = new Map();
		NFTRegistry.nextAvailableId = new Map();
		NFTRegistry.balanceOf = new Map();
	}

	public static instance: Map<string, NFT> = new Map();
	public static balanceOf: Map<string, string> = new Map();
	public static nextAvailableId: Map<string, bigint> = new Map();
}
