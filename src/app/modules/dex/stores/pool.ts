/* eslint-disable import/no-cycle */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Modules, cryptography } from 'klayr-sdk';
import { DEXPoolData, Slot0, ImmutableSwapContext, MutableSwapContext, MutableContext, TreasurifyParams, TokenMethod } from '../types';
import { Uint24String } from './library/int';
import { NFTDescriptor, PoolAddress } from './library/periphery';
import { Tick } from './library/core';
import { PoolCreatedEvent } from '../events/pool_created';
import { poolStoreSchema } from '../schema';
import { DEXPool, createImmutablePoolInstance, createMutablePoolInstance, createMutableRouterInstance } from './factory';
import { PositionManagerStore } from './position_manager';
import { TokenSymbolStore } from './token_symbol';
import { POSITION_MANAGER_ADDRESS, ROUTER_ADDRESS } from '../constants';
import { TreasurifyEvent } from '../events/treasurify';
import { SupportedTokenStore } from './supported_token';
import { DexGovernableConfig } from '../config';

export const defaultSlot0: Slot0 = Object.freeze({
	sqrtPriceX96: '0',
	tick: '0',
	observationIndex: '0',
	observationCardinality: '0',
	observationCardinalityNext: '0',
});

export class PoolStore extends Modules.BaseStore<DEXPoolData> {
	public constructor(moduleName: string, index: number, stores: Modules.NamedRegistry, events: Modules.NamedRegistry) {
		super(moduleName, index);
		this.stores = stores;
		this.events = events;
		this.moduleName = moduleName;
	}

	public addDependencies(tokenMethod: TokenMethod) {
		this.tokenMethod = tokenMethod;
		if (this.config !== undefined) this.dependencyReady = true;
	}

	public init(config: DexGovernableConfig) {
		this.config = config;
		if (this.tokenMethod !== undefined) this.dependencyReady = true;
	}

	public getKey(tokenA: Buffer, tokenB: Buffer, fee: Uint24String) {
		return PoolAddress.computeAddress(PoolAddress.getPoolKey(tokenA, tokenB, fee));
	}

	public async getMutableRouter(ctx: MutableSwapContext) {
		this._checkDependencies();
		const config = await this.config!.getConfig(ctx.context);
		return createMutableRouterInstance(ctx, this.stores, this.tokenMethod!, config, this.moduleName);
	}

	public async getImmutablePool(ctx: ImmutableSwapContext, tokenA: Buffer, tokenB: Buffer, fee: Uint24String): Promise<DEXPool> {
		this._checkDependencies();

		if (!this.schema) {
			throw new Error('Schema is not set');
		}

		const subStore = ctx.context.getStore(this.storePrefix, this.subStorePrefix);
		const pool = await subStore.getWithSchema<DEXPoolData>(this.getKey(tokenA, tokenB, fee), this.schema);
		const config = await this.config!.getConfig(ctx.context);
		return createImmutablePoolInstance(ctx, pool, this.stores, this.events, this.tokenMethod!, config, this.moduleName);
	}

	public async getMutablePool(ctx: MutableSwapContext, tokenA: Buffer, tokenB: Buffer, fee: Uint24String): Promise<DEXPool> {
		this._checkDependencies();

		if (!this.schema) {
			throw new Error('Schema is not set');
		}

		const subStore = ctx.context.getStore(this.storePrefix, this.subStorePrefix);
		const pool = await subStore.getWithSchema<DEXPoolData>(this.getKey(tokenA, tokenB, fee), this.schema);
		const config = await this.config!.getConfig(ctx.context);
		return createMutablePoolInstance(ctx, pool, this.stores, this.events, this.tokenMethod!, config, this.moduleName);
	}

	public async createPool(
		ctx: MutableSwapContext,
		tokenA: Buffer,
		tokenASymbol: string,
		tokenADecimal: number,
		tokenB: Buffer,
		tokenBSymbol: string,
		tokenBDecimal: number,
		fee: Uint24String,
	): Promise<DEXPool> {
		this._checkDependencies();

		if (tokenA.subarray(0, 1).compare(tokenB.subarray(0, 1)) !== 0) throw new Error('tokenA and tokenB are not from same network');

		const config = await this.config!.getConfig(ctx.context);

		const feeAmountTickSpacing = config.feeAmountTickSpacing.find(t => t.fee === fee);
		if (!feeAmountTickSpacing) throw new Error('tickSpacing unsupported');

		const key = this.getKey(tokenA, tokenB, fee);
		const orderedTokenKey = PoolAddress.getPoolKey(tokenA, tokenB, fee);
		if (await this.has(ctx.context, key)) throw new Error('pool already exists');

		const pool: DEXPoolData = {
			...orderedTokenKey,
			tickSpacing: feeAmountTickSpacing.tickSpacing,
			maxLiquidityPerTick: Tick.tickSpacingToMaxLiquidityPerTick(feeAmountTickSpacing.tickSpacing),
			feeGrowthGlobal0X128: '0',
			feeGrowthGlobal1X128: '0',
			liquidity: '0',
			slot0: { ...defaultSlot0 },
		};

		await this.set(ctx.context, key, pool);

		await this.tokenMethod!.initializeUserAccount(ctx.context, key, tokenA);
		await this.tokenMethod!.initializeUserAccount(ctx.context, key, tokenB);

		await this.tokenMethod!.initializeUserAccount(ctx.context, POSITION_MANAGER_ADDRESS, tokenA);
		await this.tokenMethod!.initializeUserAccount(ctx.context, POSITION_MANAGER_ADDRESS, tokenB);

		await this.tokenMethod!.initializeUserAccount(ctx.context, ROUTER_ADDRESS, tokenA);
		await this.tokenMethod!.initializeUserAccount(ctx.context, ROUTER_ADDRESS, tokenB);

		const tokenABalance = await this.tokenMethod!.getAvailableBalance(ctx.context, key, tokenA);
		const tokenBBalance = await this.tokenMethod!.getAvailableBalance(ctx.context, key, tokenB);

		if (config.feeProtocolPool) {
			const treasury = cryptography.address.getAddressFromKlayr32Address(config.feeProtocolPool, config.feeProtocolPool.substring(0, 3));
			await this.tokenMethod!.initializeUserAccount(ctx.context, treasury, tokenA);
			await this.tokenMethod!.initializeUserAccount(ctx.context, treasury, tokenB);

			if (tokenABalance > BigInt(0)) {
				await this.tokenMethod!.transfer(ctx.context, key, treasury, tokenA, tokenABalance);
			}
			if (tokenBBalance > BigInt(0)) {
				await this.tokenMethod!.transfer(ctx.context, key, treasury, tokenB, tokenBBalance);
			}
		} else {
			if (tokenABalance > BigInt(0)) {
				await this.tokenMethod!.lock(ctx.context, key, this.moduleName, tokenA, tokenABalance);
			}
			if (tokenBBalance > BigInt(0)) {
				await this.tokenMethod!.lock(ctx.context, key, this.moduleName, tokenB, tokenBBalance);
			}
		}

		const supportManagerStore = this.stores.get(SupportedTokenStore);
		await supportManagerStore.addSupport(ctx.context, tokenA);
		await supportManagerStore.addSupport(ctx.context, tokenB);

		const tokenSymbolStore = this.stores.get(TokenSymbolStore);
		await tokenSymbolStore.registerSymbol(ctx.context, tokenA, tokenASymbol, tokenADecimal);
		await tokenSymbolStore.registerSymbol(ctx.context, tokenB, tokenBSymbol, tokenBDecimal);

		const positionManagerStore = this.stores.get(PositionManagerStore);
		const positionNameAndSymbol = `${tokenASymbol}/${tokenBSymbol}/${NFTDescriptor.feeToPercentString(fee)}`;
		await positionManagerStore.set(ctx.context, positionManagerStore.getKey(key), {
			poolAddress: key,
			name: `${config.nftPositionMetadata.dex.name} Positions NFT - ${positionNameAndSymbol}`,
			symbol: `${config.nftPositionMetadata.dex.symbol.toUpperCase()}POS-${positionNameAndSymbol}`,
		});

		const events = this.events.get(PoolCreatedEvent);
		events.add(
			ctx.context,
			{
				...orderedTokenKey,
				tickSpacing: feeAmountTickSpacing.tickSpacing,
				poolAddress: key,
			},
			[key],
		);

		return this.getMutablePool(ctx, tokenA, tokenB, fee);
	}

	public async releaseTokenToProtocolTreasury(context: MutableContext, params: TreasurifyParams) {
		const config = await this.config!.getConfig(context);

		if (config.feeProtocolPool) {
			if (params.address.compare(ROUTER_ADDRESS) !== 0 && !(await this.has(context, params.address))) {
				throw new Error('pool doesnt exists, and address is not a router');
			}

			const poolKey = PoolAddress.decodePoolAddress(params.address);
			if ((await this.has(context, params.address)) && (params.token.compare(poolKey.token0) === 0 || params.token.compare(poolKey.token1) === 0)) {
				throw new Error(`invalid attempt to treasurify pool's token0 or token1`);
			}

			let tokenToBeTransferred = BigInt(0);
			let tokenToBeUnlocked = BigInt(0);

			tokenToBeUnlocked = await this.tokenMethod!.getLockedAmount(context, params.address, params.token, this.moduleName);
			tokenToBeTransferred = await this.tokenMethod!.getAvailableBalance(context, params.address, params.token);

			if (tokenToBeTransferred > BigInt(0) || tokenToBeUnlocked > BigInt(0)) {
				const treasury = cryptography.address.getAddressFromKlayr32Address(config.feeProtocolPool, config.feeProtocolPool.substring(0, 3));

				let amount = tokenToBeTransferred;

				if (tokenToBeUnlocked > BigInt(0)) {
					await this.tokenMethod!.unlock(context, params.address, this.moduleName, params.token, tokenToBeUnlocked);
					amount += tokenToBeUnlocked;
				}

				await this.tokenMethod!.transfer(context, params.address, treasury, params.token, amount);

				const events = this.events.get(TreasurifyEvent);
				events.add(
					context,
					{
						poolAddress: params.address,
						treasuryAddress: treasury,
						token: params.token,
						amount: amount.toString(),
					},
					[params.address, treasury],
				);
			}
		}
	}

	private _checkDependencies() {
		if (!this.dependencyReady) {
			throw new Error('dependencies not configured');
		}
	}

	public schema = poolStoreSchema;

	private readonly events: Modules.NamedRegistry;
	private readonly stores: Modules.NamedRegistry;
	private readonly moduleName: string;

	private tokenMethod: TokenMethod | undefined;
	private config: DexGovernableConfig | undefined;

	private dependencyReady = false;
}
