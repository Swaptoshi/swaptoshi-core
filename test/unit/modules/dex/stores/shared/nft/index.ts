/* eslint-disable import/no-cycle */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable camelcase */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable import/no-extraneous-dependencies */

import { InternalMethod } from 'lisk-framework/dist-node/modules/nft/internal_method';
import { NFTAttributes } from 'lisk-framework/dist-node/modules/nft/stores/nft';
import { ModuleConfig, FeeMethod, NFT } from 'lisk-framework/dist-node/modules/nft/types';
import { ImmutableMethodContext, MethodContext, NFTMethod } from 'lisk-sdk';
import { NFTRegistry } from './nft_registry';
import { chainID } from '../module';

export const mock_nft_init = jest.fn();
export const mock_nft_addDependencies = jest.fn();
export const mock_nft_getChainID = jest.fn();
export const mock_nft_isNFTEscrowed = jest.fn();
export const mock_nft_isNFTLocked = jest.fn();
export const mock_nft_getNFT = jest.fn();
export const mock_nft_destroy = jest.fn();
export const mock_nft_getCollectionID = jest.fn();
export const mock_nft_isNFTSupported = jest.fn();
export const mock_nft_getNextAvailableIndex = jest.fn();
export const mock_nft_create = jest.fn();
export const mock_nft_lock = jest.fn();
export const mock_nft_unlock = jest.fn();
export const mock_nft_transfer = jest.fn();
export const mock_nft_transferCrossChain = jest.fn();
export const mock_nft_supportAllNFTs = jest.fn();
export const mock_nft_removeSupportAllNFTs = jest.fn();
export const mock_nft_supportAllNFTsFromChain = jest.fn();
export const mock_nft_removeSupportAllNFTsFromChain = jest.fn();
export const mock_nft_supportAllNFTsFromCollection = jest.fn();
export const mock_nft_removeSupportAllNFTsFromCollection = jest.fn();
export const mock_nft_recover = jest.fn();
export const mock_nft_setAttributes = jest.fn();

export class MockedNFTMethod implements Omit<NFTMethod, ''> {
	public init(_config: ModuleConfig): void {
		mock_nft_init(_config);
	}
	public addDependencies(_internalMethod: InternalMethod, _feeMethod: FeeMethod): void {
		mock_nft_addDependencies(_internalMethod, _feeMethod);
	}
	public getChainID(_nftID: Buffer): Buffer {
		mock_nft_getChainID(_nftID);
		return chainID;
	}
	public isNFTEscrowed(_nft: NFT): boolean {
		mock_nft_isNFTEscrowed(_nft);
		return true;
	}
	public isNFTLocked(_nft: NFT): boolean {
		mock_nft_isNFTLocked(_nft);
		return true;
	}
	public async getNFT(_methodContext: ImmutableMethodContext, _nftID: Buffer): Promise<NFT> {
		mock_nft_getNFT(_nftID);
		const nft = NFTRegistry.instance.get(_nftID.toString('hex'));
		if (nft) {
			return nft;
		}
		throw new Error(`NFT doesnt exist`);
	}
	public async destroy(
		_methodContext: MethodContext,
		_address: Buffer,
		_nftID: Buffer,
	): Promise<void> {
		mock_nft_destroy(_address, _nftID);
		const nft = NFTRegistry.instance.get(_nftID.toString('hex'));
		if (nft && nft.owner.compare(_address) === 0) {
			NFTRegistry.instance.delete(_nftID.toString('hex'));
			return;
		}
		throw new Error('not owner');
	}
	public getCollectionID(_nftID: Buffer): Buffer {
		mock_nft_getCollectionID(_nftID);
		return Buffer.alloc(0);
	}
	public async isNFTSupported(
		_methodContext: ImmutableMethodContext,
		_nftID: Buffer,
	): Promise<boolean> {
		mock_nft_isNFTSupported(_nftID);
		return true;
	}
	public async getNextAvailableIndex(
		_methodContext: MethodContext,
		_collectionID: Buffer,
	): Promise<bigint> {
		mock_nft_getNextAvailableIndex(_collectionID);
		return NFTRegistry.nextAvailableId.get(_collectionID.toString('hex')) ?? BigInt(0);
	}
	public async create(
		_methodContext: MethodContext,
		_address: Buffer,
		_collectionID: Buffer,
		_attributesArray: NFTAttributes[],
	): Promise<void> {
		mock_nft_create(_address, _collectionID, _attributesArray);
		const nft = {
			owner: _address,
			attributesArray: _attributesArray,
		};
		NFTRegistry.createToken(_address, _collectionID, nft);
	}
	public async lock(_methodContext: MethodContext, _module: string, _nftID: Buffer): Promise<void> {
		mock_nft_lock(_module, _nftID);
	}
	public async unlock(
		_methodContext: MethodContext,
		_module: string,
		_nftID: Buffer,
	): Promise<void> {
		mock_nft_unlock(_module, _nftID);
	}
	public async transfer(
		_methodContext: MethodContext,
		_senderAddress: Buffer,
		_recipientAddress: Buffer,
		_nftID: Buffer,
	): Promise<void> {
		mock_nft_transfer(_senderAddress, _recipientAddress, _nftID);
	}
	public async transferCrossChain(
		_methodContext: MethodContext,
		_senderAddress: Buffer,
		_recipientAddress: Buffer,
		_nftID: Buffer,
		_receivingChainID: Buffer,
		_messageFee: bigint,
		_data: string,
		_includeAttributes: boolean,
	): Promise<void> {
		mock_nft_transferCrossChain(
			_senderAddress,
			_recipientAddress,
			_nftID,
			_receivingChainID,
			_messageFee,
			_data,
			_includeAttributes,
		);
	}
	public async supportAllNFTs(_methodContext: MethodContext): Promise<void> {
		mock_nft_supportAllNFTs();
	}
	public async removeSupportAllNFTs(_methodContext: MethodContext): Promise<void> {
		mock_nft_removeSupportAllNFTs();
	}
	public async supportAllNFTsFromChain(
		_methodContext: MethodContext,
		_chainID: Buffer,
	): Promise<void> {
		mock_nft_supportAllNFTsFromChain(_chainID);
	}
	public async removeSupportAllNFTsFromChain(
		_methodContext: MethodContext,
		_chainID: Buffer,
	): Promise<void> {
		mock_nft_removeSupportAllNFTsFromChain(_chainID);
	}
	public async supportAllNFTsFromCollection(
		_methodContext: MethodContext,
		_chainID: Buffer,
		_collectionID: Buffer,
	): Promise<void> {
		mock_nft_supportAllNFTsFromCollection(_chainID, _collectionID);
	}
	public async removeSupportAllNFTsFromCollection(
		_methodContext: MethodContext,
		_chainID: Buffer,
		_collectionID: Buffer,
	): Promise<void> {
		mock_nft_removeSupportAllNFTsFromCollection(_chainID, _collectionID);
	}
	public async recover(
		_methodContext: MethodContext,
		_terminatedChainID: Buffer,
		_substorePrefix: Buffer,
		_nftID: Buffer,
		_nft: Buffer,
	): Promise<void> {
		mock_nft_recover(_terminatedChainID, _substorePrefix, _nftID, _nft);
	}
	public async setAttributes(
		_methodContext: MethodContext,
		_module: string,
		_nftID: Buffer,
		_attributes: Buffer,
	): Promise<void> {
		mock_nft_setAttributes(_module, _nftID, _attributes);
		const nft = NFTRegistry.instance.get(_nftID.toString('hex'));
		if (nft) {
			const index = nft.attributesArray.findIndex(t => t.module === _module);
			if (index < 0) {
				nft.attributesArray.push({
					module: _module,
					attributes: _attributes,
				});
			} else {
				nft.attributesArray[index].attributes = _attributes;
			}
			NFTRegistry.instance.set(_nftID.toString('hex'), nft);
			return;
		}
		throw new Error(`NFT doesnt exist`);
	}
}
