/* eslint-disable import/no-cycle */
import { BaseMethod, ImmutableMethodContext, MethodContext } from 'klayr-sdk';
import { ICOPool } from './stores/instances/ico_pool';
import { Airdrop } from './stores/instances/airdrop';
import { Factory } from './stores/instances/factory';
import { AirdropCreateParams, NextAvailableTokenIdStoreData, StoreInstance, TokenCreateParams, TokenFactoryAttributes } from './types';
import { VestingUnlock } from './stores/instances/vesting_unlock';
import { ICOStore } from './stores/ico';
import { immutableMethodFactoryContext, methodFactoryContext } from './stores/context';
import { AirdropStore } from './stores/airdrop';
import { FactoryStore } from './stores/factory';
import { VestingUnlockStore } from './stores/vesting_unlock';
import { NextAvailableTokenIdStore } from './stores/next_available_token_id';
import { ICORouter } from './stores/instances/ico_router';
import { ICOQuoter } from './stores/instances/ico_quoter';

export class TokenFactoryMethod extends BaseMethod {
	public async createICOPool(
		context: MethodContext,
		senderAddress: Buffer,
		timestamp: number,
		height: number,
		tokenIn: Buffer,
		tokenOut: Buffer,
		price: string,
		providerAddress: Buffer,
		amount: bigint,
	) {
		const icoStore = this.stores.get(ICOStore);
		const _context = methodFactoryContext(context, senderAddress, timestamp, height);
		const ico = await icoStore.getMutableEmptyICOPool(_context);
		await ico.create({
			tokenIn,
			tokenOut,
			providerAddress,
			price,
			amount,
		});
	}

	public async createAirdrop(
		context: MethodContext,
		senderAddress: Buffer,
		timestamp: number,
		height: number,
		tokenId: Buffer,
		providerAddress: Buffer,
		recipients: AirdropCreateParams['recipients'],
	) {
		const airdropStore = this.stores.get(AirdropStore);
		const _context = methodFactoryContext(context, senderAddress, timestamp, height);
		const airdrop = await airdropStore.getMutableEmptyAirdrop(_context);
		await airdrop.create({
			tokenId,
			providerAddress,
			recipients,
		});
	}

	public async createTokenFactory(
		context: MethodContext,
		senderAddress: Buffer,
		timestamp: number,
		height: number,
		distribution: TokenCreateParams['distribution'],
		attributesArray: TokenFactoryAttributes[],
	) {
		const factoryStore = this.stores.get(FactoryStore);
		const _context = methodFactoryContext(context, senderAddress, timestamp, height);
		const factory = await factoryStore.getMutableEmptyFactory(_context);
		await factory.create({
			distribution,
			attributes: attributesArray,
		});
	}

	public async getICOPool(context: MethodContext, senderAddress: Buffer, timestamp: number, height: number, tokenIn: Buffer, tokenOut: Buffer): Promise<StoreInstance<ICOPool>> {
		const icoStore = this.stores.get(ICOStore);
		const _context = methodFactoryContext(context, senderAddress, timestamp, height);
		return icoStore.getMutableICOPool(_context, tokenIn, tokenOut);
	}

	public async getICORouter(context: MethodContext, senderAddress: Buffer, timestamp: number, height: number): Promise<StoreInstance<ICORouter>> {
		const icoStore = this.stores.get(ICOStore);
		const _context = methodFactoryContext(context, senderAddress, timestamp, height);
		return icoStore.getMutableICORouter(_context);
	}

	public async getICOQuoter(context: ImmutableMethodContext, senderAddress: Buffer, timestamp: number, height: number): Promise<StoreInstance<ICOQuoter>> {
		const icoStore = this.stores.get(ICOStore);
		const _context = immutableMethodFactoryContext(context, senderAddress, timestamp, height);
		return icoStore.getImmutableICOQuoter(_context);
	}

	public async getAirdrop(context: MethodContext, senderAddress: Buffer, timestamp: number, height: number, tokenId: Buffer, providerAddress: Buffer): Promise<StoreInstance<Airdrop>> {
		const airdropStore = this.stores.get(AirdropStore);
		const _context = methodFactoryContext(context, senderAddress, timestamp, height);
		return airdropStore.getMutableAirdrop(_context, tokenId, providerAddress);
	}

	public async getFactory(context: MethodContext, senderAddress: Buffer, timestamp: number, height: number, tokenId: Buffer): Promise<StoreInstance<Factory>> {
		const factoryStore = this.stores.get(FactoryStore);
		const _context = methodFactoryContext(context, senderAddress, timestamp, height);
		return factoryStore.getMutableFactory(_context, tokenId);
	}

	public async getVestingUnlock(context: MethodContext, senderAddress: Buffer, timestamp: number, height: number): Promise<StoreInstance<VestingUnlock>> {
		const vestingUnlockStore = this.stores.get(VestingUnlockStore);
		const _context = methodFactoryContext(context, senderAddress, timestamp, height);
		return vestingUnlockStore.getInstance(_context);
	}

	public async getNextAvailableTokenId(context: MethodContext): Promise<NextAvailableTokenIdStoreData> {
		const nextAvailableTokenIdStore = this.stores.get(NextAvailableTokenIdStore);
		return nextAvailableTokenIdStore.getOrDefault(context);
	}
}
