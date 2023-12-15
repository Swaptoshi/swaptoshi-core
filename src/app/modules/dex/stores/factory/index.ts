/* eslint-disable import/no-cycle */
import { NFTMethod, NamedRegistry, TokenMethod } from 'lisk-sdk';
import {
	SwaptoshiPoolData,
	DexModuleConfig,
	PositionManager,
	ImmutableSwapContext,
	MutableSwapContext,
} from '../../types';
import { SwaptoshiPool } from './pool';
import { SwapRouter } from './swap_router';
import { NonfungiblePositionManager } from './position_manager';

export function createImmutablePoolInstance(
	context: ImmutableSwapContext,
	pool: SwaptoshiPoolData,
	stores: NamedRegistry,
	events: NamedRegistry,
	tokenMethod: TokenMethod,
	config: DexModuleConfig,
) {
	const res = new SwaptoshiPool(pool, stores, events, config);
	res.addImmutableDependencies(context, tokenMethod);
	return res;
}

export function createMutablePoolInstance(
	context: MutableSwapContext,
	pool: SwaptoshiPoolData,
	stores: NamedRegistry,
	events: NamedRegistry,
	tokenMethod: TokenMethod,
	config: DexModuleConfig,
) {
	const res = new SwaptoshiPool(pool, stores, events, config);
	res.addMutableDependencies(context, tokenMethod);
	return res;
}

export function createMutableRouterInstance(
	context: MutableSwapContext,
	stores: NamedRegistry,
	tokenMethod: TokenMethod,
	config: DexModuleConfig,
) {
	const res = new SwapRouter(stores, config);
	res.addDependencies(context, tokenMethod);
	return res;
}

export function createImmutablePositionManagerinstance(
	positionManager: PositionManager,
	context: ImmutableSwapContext,
	stores: NamedRegistry,
	events: NamedRegistry,
	tokenMethod: TokenMethod,
	nftMethod: NFTMethod,
	chainId: Buffer,
) {
	const res = new NonfungiblePositionManager(positionManager, stores, events, chainId);
	res.addImmutableDependencies(context, tokenMethod, nftMethod);
	return res;
}

export function createMutablePositionManagerinstance(
	positionManager: PositionManager,
	context: MutableSwapContext,
	stores: NamedRegistry,
	events: NamedRegistry,
	tokenMethod: TokenMethod,
	nftMethod: NFTMethod,
	chainId: Buffer,
) {
	const res = new NonfungiblePositionManager(positionManager, stores, events, chainId);
	res.addMutableDependencies(context, tokenMethod, nftMethod);
	return res;
}

export { SwaptoshiPool } from './pool';
export { NonfungiblePositionManager } from './position_manager';
export { SwapRouter } from './swap_router';
