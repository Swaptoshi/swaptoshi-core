/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable import/no-cycle */
import { Modules, Types, cryptography } from 'klayr-sdk';
import { ImmutableSwapContext, MutableSwapContext, NFTMethod, PositionManager, TokenMethod } from '../types';
import { positionManagerStoreSchema } from '../schema';
import { createImmutablePositionManagerinstance, createMutablePositionManagerinstance } from './factory';
import { DexGovernableConfig } from '../config';

export class PositionManagerStore extends Modules.BaseStore<PositionManager> {
	public constructor(moduleName: string, index: number, stores: Modules.NamedRegistry, events: Modules.NamedRegistry) {
		super(moduleName, index);
		this.stores = stores;
		this.events = events;
		this.moduleName = moduleName;
	}

	public addDependencies(tokenMethod: TokenMethod, nftMethod: NFTMethod) {
		this.tokenMethod = tokenMethod;
		this.nftMethod = nftMethod;
		if (this.genesisConfig !== undefined && this.dexConfig !== undefined) this.dependencyReady = true;
	}

	public init(genesisConfig: Types.GenesisConfig, dexConfig: DexGovernableConfig) {
		this.genesisConfig = genesisConfig;
		this.dexConfig = dexConfig;
		if (this.tokenMethod !== undefined && this.nftMethod !== undefined) this.dependencyReady = true;
	}

	public getKey(poolAddress: Buffer) {
		const hash = cryptography.utils.hash(poolAddress);
		return hash.subarray(0, 4);
	}

	public async getImmutablePositionManager(ctx: ImmutableSwapContext, poolAddress: Buffer) {
		this._checkDependencies();

		if (!this.schema) {
			throw new Error('Schema is not set');
		}

		const subStore = ctx.context.getStore(this.storePrefix, this.subStorePrefix);
		const positionManager = await subStore.getWithSchema<PositionManager>(this.getKey(poolAddress), this.schema);
		const config = await this.dexConfig!.getConfig(ctx.context);
		return createImmutablePositionManagerinstance(positionManager, ctx, this.stores, this.events, this.tokenMethod!, this.nftMethod!, this.genesisConfig!, config, this.moduleName);
	}

	public async getMutablePositionManager(ctx: MutableSwapContext, poolAddress: Buffer) {
		this._checkDependencies();

		if (!this.schema) {
			throw new Error('Schema is not set');
		}

		const subStore = ctx.context.getStore(this.storePrefix, this.subStorePrefix);
		const positionManager = await subStore.getWithSchema<PositionManager>(this.getKey(poolAddress), this.schema);
		const config = await this.dexConfig!.getConfig(ctx.context);
		return createMutablePositionManagerinstance(positionManager, ctx, this.stores, this.events, this.tokenMethod!, this.nftMethod!, this.genesisConfig!, config, this.moduleName);
	}

	private _checkDependencies() {
		if (!this.dependencyReady) {
			throw new Error('dependencies not configured');
		}
	}

	public schema = positionManagerStoreSchema;

	private readonly events: Modules.NamedRegistry;
	private readonly stores: Modules.NamedRegistry;
	private readonly moduleName: string;

	private genesisConfig: Types.GenesisConfig | undefined = undefined;
	private dexConfig: DexGovernableConfig | undefined = undefined;
	private tokenMethod: TokenMethod | undefined;
	private nftMethod: NFTMethod | undefined;

	private dependencyReady = false;
}
