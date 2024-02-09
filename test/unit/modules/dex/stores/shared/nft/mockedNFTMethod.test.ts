/* eslint-disable camelcase */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { NFTMethod } from 'lisk-sdk';
import {
	MockedNFTMethod,
	mock_nft_addDependencies,
	mock_nft_create,
	mock_nft_destroy,
	mock_nft_getChainID,
	mock_nft_getCollectionID,
	mock_nft_getNFT,
	mock_nft_getNextAvailableIndex,
	mock_nft_init,
	mock_nft_isNFTSupported,
	mock_nft_lock,
	mock_nft_recover,
	mock_nft_removeSupportAllNFTs,
	mock_nft_removeSupportAllNFTsFromChain,
	mock_nft_removeSupportAllNFTsFromCollection,
	mock_nft_setAttributes,
	mock_nft_supportAllNFTs,
	mock_nft_supportAllNFTsFromChain,
	mock_nft_supportAllNFTsFromCollection,
	mock_nft_transfer,
	mock_nft_transferCrossChain,
	mock_nft_unlock,
} from './index';
import { NFTRegistry } from './nft_registry';
import { NFT } from './nft';
import { chainID } from '../module';

const context = {} as any;
const nftModule = 'module';
const collectionId = Buffer.alloc(4);
const receivingChainID = Buffer.from('00000001', 'hex');
const nftId = Buffer.concat([chainID, collectionId, Buffer.alloc(8, 0)]);
const sender = Buffer.alloc(20);
const recipient = Buffer.from('0000000000000000000000000000000000000001', 'hex');
const nft: NFT = {
	owner: Buffer.alloc(20),
	attributesArray: [
		{
			module: nftModule,
			attributes: Buffer.alloc(10),
		},
	],
};

describe('MockedNFTMethod', () => {
	let nftMethod: NFTMethod;

	beforeEach(() => {
		nftMethod = new MockedNFTMethod() as NFTMethod;
	});

	afterEach(() => {
		NFTRegistry.reset();
	});

	describe('init', () => {
		it('should call mock method', () => {
			nftMethod.init('init' as any);
			expect(mock_nft_init).toHaveBeenCalledWith('init');
		});
	});

	describe('addDependencies', () => {
		it('should call mock method', () => {
			nftMethod.addDependencies('internalMethod' as any, 'feeMethod' as any);
			expect(mock_nft_addDependencies).toHaveBeenCalledWith('internalMethod', 'feeMethod');
		});
	});

	describe('getChainID', () => {
		it('should call mock method', () => {
			nftMethod.getChainID('getChainID' as any);
			expect(mock_nft_getChainID).toHaveBeenCalledWith('getChainID');
		});
	});

	describe('getNFT', () => {
		beforeEach(() => {
			NFTRegistry.instance.set(nftId.toString('hex'), nft);
		});

		it('should call mock method', async () => {
			await nftMethod.getNFT(context, nftId);
			expect(mock_nft_getNFT).toHaveBeenCalledWith(nftId);
		});

		it('should return nft', async () => {
			const res = await nftMethod.getNFT(context, nftId);
			expect(res).toStrictEqual(nft);
		});
	});

	describe('destroy', () => {
		beforeEach(() => {
			NFTRegistry.instance.set(nftId.toString('hex'), nft);
		});

		it('should call mock method', async () => {
			await nftMethod.destroy(context, nft.owner, nftId);
			expect(mock_nft_destroy).toHaveBeenCalledWith(nft.owner, nftId);
		});

		it('should delete nft', async () => {
			await nftMethod.destroy(context, nft.owner, nftId);
			const nftReg = NFTRegistry.instance.get(nftId.toString('hex'));
			expect(nftReg).toBeUndefined();
		});

		it('should throw an error if executed not by owner', async () => {
			await expect(
				(async () => nftMethod.destroy(context, Buffer.from('not-owner'), nftId))(),
			).rejects.toThrow();
		});
	});

	describe('getCollectionID', () => {
		it('should call mock method', () => {
			nftMethod.getCollectionID('getCollectionID' as any);
			expect(mock_nft_getCollectionID).toHaveBeenCalledWith('getCollectionID');
		});
	});

	describe('isNFTSupported', () => {
		it('should call mock method', async () => {
			await nftMethod.isNFTSupported(context, 'isNFTSupported' as any);
			expect(mock_nft_isNFTSupported).toHaveBeenCalledWith('isNFTSupported');
		});
	});

	describe('getNextAvailableIndex', () => {
		it('should call mock method', async () => {
			await nftMethod.getNextAvailableIndex(context, collectionId);
			expect(mock_nft_getNextAvailableIndex).toHaveBeenCalledWith(collectionId);
		});

		it('should start from 0', async () => {
			const res = await nftMethod.getNextAvailableIndex(context, collectionId);
			expect(res).toBe(BigInt(0));
		});
	});

	describe('create', () => {
		it('should call mock method', async () => {
			await nftMethod.create(context, nft.owner, collectionId, nft.attributesArray);
			expect(mock_nft_create).toHaveBeenCalledWith(nft.owner, collectionId, nft.attributesArray);
		});

		it('should create new nft', async () => {
			await nftMethod.create(context, nft.owner, collectionId, nft.attributesArray);
			expect(NFTRegistry.instance.get(nftId.toString('hex'))).toBeDefined();
		});
	});

	describe('lock', () => {
		it('should call mock method', async () => {
			await nftMethod.lock(context, nftModule, nftId);
			expect(mock_nft_lock).toHaveBeenCalledWith(nftModule, nftId);
		});
	});

	describe('unlock', () => {
		it('should call mock method', async () => {
			await nftMethod.unlock(context, nftModule, nftId);
			expect(mock_nft_unlock).toHaveBeenCalledWith(nftModule, nftId);
		});
	});

	describe('transfer', () => {
		it('should call mock method', async () => {
			await nftMethod.transfer(context, sender, recipient, nftId);
			expect(mock_nft_transfer).toHaveBeenCalledWith(sender, recipient, nftId);
		});
	});

	describe('transferCrossChain', () => {
		it('should call mock method', async () => {
			await nftMethod.transferCrossChain(
				context,
				sender,
				recipient,
				nftId,
				receivingChainID,
				BigInt(0),
				'',
				true,
			);
			expect(mock_nft_transferCrossChain).toHaveBeenCalledWith(
				sender,
				recipient,
				nftId,
				receivingChainID,
				BigInt(0),
				'',
				true,
			);
		});
	});

	describe('supportAllNFTs', () => {
		it('should call mock method', async () => {
			await nftMethod.supportAllNFTs(context);
			expect(mock_nft_supportAllNFTs).toHaveBeenCalled();
		});
	});

	describe('removeSupportAllNFTs', () => {
		it('should call mock method', async () => {
			await nftMethod.removeSupportAllNFTs(context);
			expect(mock_nft_removeSupportAllNFTs).toHaveBeenCalled();
		});
	});

	describe('supportAllNFTsFromChain', () => {
		it('should call mock method', async () => {
			await nftMethod.supportAllNFTsFromChain(context, receivingChainID);
			expect(mock_nft_supportAllNFTsFromChain).toHaveBeenCalledWith(receivingChainID);
		});
	});

	describe('removeSupportAllNFTsFromChain', () => {
		it('should call mock method', async () => {
			await nftMethod.removeSupportAllNFTsFromChain(context, receivingChainID);
			expect(mock_nft_removeSupportAllNFTsFromChain).toHaveBeenCalledWith(receivingChainID);
		});
	});

	describe('supportAllNFTsFromCollection', () => {
		it('should call mock method', async () => {
			await nftMethod.supportAllNFTsFromCollection(context, receivingChainID, collectionId);
			expect(mock_nft_supportAllNFTsFromCollection).toHaveBeenCalledWith(
				receivingChainID,
				collectionId,
			);
		});
	});

	describe('removeSupportAllNFTsFromCollection', () => {
		it('should call mock method', async () => {
			await nftMethod.removeSupportAllNFTsFromCollection(context, receivingChainID, collectionId);
			expect(mock_nft_removeSupportAllNFTsFromCollection).toHaveBeenCalledWith(
				receivingChainID,
				collectionId,
			);
		});
	});

	describe('recover', () => {
		it('should call mock method', async () => {
			await nftMethod.recover(
				context,
				receivingChainID,
				Buffer.alloc(1),
				Buffer.alloc(1),
				Buffer.alloc(1),
			);
			expect(mock_nft_recover).toHaveBeenCalledWith(
				receivingChainID,
				Buffer.alloc(1),
				Buffer.alloc(1),
				Buffer.alloc(1),
			);
		});
	});

	describe('setAttributes', () => {
		beforeEach(() => {
			NFTRegistry.instance.set(nftId.toString('hex'), nft);
		});

		it('should call mock method', async () => {
			await nftMethod.setAttributes(context, nftModule, nftId, Buffer.from('new-attribute'));
			expect(mock_nft_setAttributes).toHaveBeenCalledWith(
				nftModule,
				nftId,
				Buffer.from('new-attribute'),
			);
		});

		it('should change attributes array', async () => {
			await nftMethod.setAttributes(context, nftModule, nftId, Buffer.from('new-attribute'));
			const res = await nftMethod.getNFT(context, nftId);
			expect(res.attributesArray[0].attributes).toStrictEqual(Buffer.from('new-attribute'));
		});
	});
});
