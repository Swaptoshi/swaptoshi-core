/* eslint-disable import/no-cycle */
import { GenesisConfig, NamedRegistry, TokenMethod } from 'klayr-sdk';
import {
	DEXPoolData,
	DexModuleConfig,
	PositionManager,
	ImmutableSwapContext,
	MutableSwapContext,
} from '../../types';
import { DEXPool } from './pool';
import { SwapRouter } from './swap_router';
import { NonfungiblePositionManager } from './position_manager';
import { NFTMethod } from '../../../nft';

export function createImmutablePoolInstance(
	context: ImmutableSwapContext,
	pool: DEXPoolData,
	stores: NamedRegistry,
	events: NamedRegistry,
	tokenMethod: TokenMethod,
	config: DexModuleConfig,
	moduleName: string,
) {
	const res = new DEXPool(pool, stores, events, config, moduleName);
	res.addImmutableDependencies(context, tokenMethod);
	return res;
}

export function createMutablePoolInstance(
	context: MutableSwapContext,
	pool: DEXPoolData,
	stores: NamedRegistry,
	events: NamedRegistry,
	tokenMethod: TokenMethod,
	config: DexModuleConfig,
	moduleName: string,
) {
	const res = new DEXPool(pool, stores, events, config, moduleName);
	res.addMutableDependencies(context, tokenMethod);
	return res;
}

export function createMutableRouterInstance(
	context: MutableSwapContext,
	stores: NamedRegistry,
	tokenMethod: TokenMethod,
	config: DexModuleConfig,
	moduleName: string,
) {
	const res = new SwapRouter(stores, config, moduleName);
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
	genesisConfig: GenesisConfig,
	dexConfig: DexModuleConfig,
	moduleName: string,
) {
	const res = new NonfungiblePositionManager(
		positionManager,
		stores,
		events,
		genesisConfig,
		dexConfig,
		moduleName,
	);
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
	genesisConfig: GenesisConfig,
	dexConfig: DexModuleConfig,
	moduleName: string,
) {
	const res = new NonfungiblePositionManager(
		positionManager,
		stores,
		events,
		genesisConfig,
		dexConfig,
		moduleName,
	);
	res.addMutableDependencies(context, tokenMethod, nftMethod);
	return res;
}

export { DEXPool } from './pool';
export { NonfungiblePositionManager } from './position_manager';
export { SwapRouter } from './swap_router';
