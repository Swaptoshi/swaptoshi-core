/* eslint-disable import/no-cycle */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { BaseStore, NamedRegistry, TokenMethod, cryptography } from 'lisk-sdk';
import {
	SwaptoshiPoolData,
	DexModuleConfig,
	Slot0,
	ImmutableSwapContext,
	MutableSwapContext,
	MutableContext,
	TreasurifyParams,
} from '../types';
import { Uint24String } from './library/int';
import { NFTDescriptor, PoolAddress } from './library/periphery';
import { Tick } from './library/core';
import { PoolCreatedEvent } from '../events/pool_created';
import { poolStoreSchema } from '../schema/stores/pool';
import {
	SwaptoshiPool,
	createImmutablePoolInstance,
	createMutablePoolInstance,
	createMutableRouterInstance,
} from './factory';
import { PositionManagerStore } from './position_manager';
import { TokenSymbolStore } from './token_symbol';
import { POSITION_MANAGER_ADDRESS, ROUTER_ADDRESS } from '../constants';
import { TreasurifyEvent } from '../events/treasurify';
import { SupportedTokenStore } from './supported_token';

export const defaultSlot0: Slot0 = Object.freeze({
	sqrtPriceX96: '0',
	tick: '0',
	observationIndex: '0',
	observationCardinality: '0',
	observationCardinalityNext: '0',
});

export class PoolStore extends BaseStore<SwaptoshiPoolData> {
	public constructor(
		moduleName: string,
		index: number,
		stores: NamedRegistry,
		events: NamedRegistry,
	) {
		super(moduleName, index);
		this.stores = stores;
		this.events = events;
	}

	public addDependencies(tokenMethod: TokenMethod) {
		this.tokenMethod = tokenMethod;
		if (this.config !== undefined) this.dependencyReady = true;
	}

	public init(config: DexModuleConfig) {
		this.config = config;
		this.feeAmountTickSpacing = new Map(config.feeAmountTickSpacing);
		if (this.tokenMethod !== undefined) this.dependencyReady = true;
	}

	public getKey(tokenA: Buffer, tokenB: Buffer, fee: Uint24String) {
		return PoolAddress.computeAddress(PoolAddress.getPoolKey(tokenA, tokenB, fee));
	}

	public getMutableRouter(ctx: MutableSwapContext) {
		this._checkDependencies();
		return createMutableRouterInstance(ctx, this.stores, this.tokenMethod!, this.config!);
	}

	public async getImmutablePool(
		ctx: ImmutableSwapContext,
		tokenA: Buffer,
		tokenB: Buffer,
		fee: Uint24String,
	): Promise<SwaptoshiPool> {
		this._checkDependencies();

		if (!this.schema) {
			throw new Error('Schema is not set');
		}

		const subStore = ctx.context.getStore(this.storePrefix, this.subStorePrefix);
		const pool = await subStore.getWithSchema<SwaptoshiPoolData>(
			this.getKey(tokenA, tokenB, fee),
			this.schema,
		);
		return createImmutablePoolInstance(
			ctx,
			pool,
			this.stores,
			this.events,
			this.tokenMethod!,
			this.config!,
		);
	}

	public async getMutablePool(
		ctx: MutableSwapContext,
		tokenA: Buffer,
		tokenB: Buffer,
		fee: Uint24String,
	): Promise<SwaptoshiPool> {
		this._checkDependencies();

		if (!this.schema) {
			throw new Error('Schema is not set');
		}

		const subStore = ctx.context.getStore(this.storePrefix, this.subStorePrefix);
		const pool = await subStore.getWithSchema<SwaptoshiPoolData>(
			this.getKey(tokenA, tokenB, fee),
			this.schema,
		);
		return createMutablePoolInstance(
			ctx,
			pool,
			this.stores,
			this.events,
			this.tokenMethod!,
			this.config!,
		);
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
	): Promise<SwaptoshiPool> {
		this._checkDependencies();

		if (tokenA.subarray(0, 1).compare(tokenB.subarray(0, 1)) !== 0)
			throw new Error('tokenA and tokenB are not from same network');

		const tickSpacing = this.feeAmountTickSpacing.get(fee) ?? '0';
		if (tickSpacing === '0') throw new Error('tickSpacing unsupported');

		const key = this.getKey(tokenA, tokenB, fee);
		const orderedTokenKey = PoolAddress.getPoolKey(tokenA, tokenB, fee);
		if (await this.has(ctx.context, key)) throw new Error('pool already exists');

		const pool: SwaptoshiPoolData = {
			...orderedTokenKey,
			tickSpacing,
			maxLiquidityPerTick: Tick.tickSpacingToMaxLiquidityPerTick(tickSpacing),
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

		if (this.config!.feeProtocolPool) {
			const treasury = cryptography.address.getAddressFromLisk32Address(
				this.config!.feeProtocolPool,
				this.config!.feeProtocolPool.substring(0, 3),
			);
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
				await this.tokenMethod!.lock(ctx.context, key, 'dex', tokenA, tokenABalance);
			}
			if (tokenBBalance > BigInt(0)) {
				await this.tokenMethod!.lock(ctx.context, key, 'dex', tokenB, tokenBBalance);
			}
		}

		const supportManagerStore = this.stores.get(SupportedTokenStore);
		await supportManagerStore.addSupport(ctx.context, tokenA);
		await supportManagerStore.addSupport(ctx.context, tokenB);

		const tokenSymbolStore = this.stores.get(TokenSymbolStore);
		await tokenSymbolStore.registerSymbol(ctx.context, tokenA, tokenASymbol, tokenADecimal);
		await tokenSymbolStore.registerSymbol(ctx.context, tokenB, tokenBSymbol, tokenBDecimal);

		const positionManagerStore = this.stores.get(PositionManagerStore);
		const positionNameAndSymbol = `${tokenASymbol}/${tokenBSymbol}/${NFTDescriptor.feeToPercentString(
			fee,
		)}`;
		await positionManagerStore.set(ctx.context, positionManagerStore.getKey(key), {
			poolAddress: key,
			name: `Swaptoshi Positions NFT - ${positionNameAndSymbol}`,
			symbol: `SWTPOS-${positionNameAndSymbol}`,
		});

		const events = this.events.get(PoolCreatedEvent);
		events.add(
			ctx.context,
			{
				...orderedTokenKey,
				tickSpacing,
				poolAddress: key,
			},
			[key],
		);

		return this.getMutablePool(ctx, tokenA, tokenB, fee);
	}

	public async releaseTokenToProtocolTreasury(context: MutableContext, params: TreasurifyParams) {
		if (this.config!.feeProtocolPool) {
			if (
				params.address.compare(ROUTER_ADDRESS) !== 0 &&
				!(await this.has(context, params.address))
			) {
				throw new Error('pool doesnt exists, and address is not a router');
			}

			let tokenToBeTransferred = BigInt(0);
			let tokenToBeUnlocked = BigInt(0);

			tokenToBeUnlocked = await this.tokenMethod!.getLockedAmount(
				context,
				params.address,
				params.token,
				'dex',
			);
			tokenToBeTransferred = await this.tokenMethod!.getAvailableBalance(
				context,
				params.address,
				params.token,
			);

			if (tokenToBeTransferred > BigInt(0) || tokenToBeUnlocked > BigInt(0)) {
				const treasury = cryptography.address.getAddressFromLisk32Address(
					this.config!.feeProtocolPool,
					this.config!.feeProtocolPool.substring(0, 3),
				);

				let amount = tokenToBeTransferred;

				if (tokenToBeUnlocked > BigInt(0)) {
					await this.tokenMethod!.unlock(
						context,
						params.address,
						'dex',
						params.token,
						tokenToBeUnlocked,
					);
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

	private readonly events: NamedRegistry;
	private readonly stores: NamedRegistry;

	private tokenMethod: TokenMethod | undefined;
	private config: DexModuleConfig | undefined;
	private feeAmountTickSpacing: Map<string, string> = new Map();

	private dependencyReady = false;
}
