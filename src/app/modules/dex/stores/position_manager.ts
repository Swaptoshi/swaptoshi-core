/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable import/no-cycle */
import { BaseStore, NFTMethod, NamedRegistry, TokenMethod, cryptography } from 'lisk-sdk';
import { ImmutableSwapContext, MutableSwapContext, PositionManager } from '../types';
import { positionManagerStoreSchema } from '../schema/stores/position_manager';
import {
	createImmutablePositionManagerinstance,
	createMutablePositionManagerinstance,
} from './factory';

export class PositionManagerStore extends BaseStore<PositionManager> {
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

	public addDependencies(tokenMethod: TokenMethod, nftMethod: NFTMethod) {
		this.tokenMethod = tokenMethod;
		this.nftMethod = nftMethod;
		if (this.chainId !== undefined) this.dependencyReady = true;
	}

	public init(chainId: Buffer) {
		this.chainId = chainId;
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
		const positionManager = await subStore.getWithSchema<PositionManager>(
			this.getKey(poolAddress),
			this.schema,
		);
		return createImmutablePositionManagerinstance(
			positionManager,
			ctx,
			this.stores,
			this.events,
			this.tokenMethod!,
			this.nftMethod!,
			this.chainId,
		);
	}

	public async getMutablePositionManager(ctx: MutableSwapContext, poolAddress: Buffer) {
		this._checkDependencies();

		if (!this.schema) {
			throw new Error('Schema is not set');
		}

		const subStore = ctx.context.getStore(this.storePrefix, this.subStorePrefix);
		const positionManager = await subStore.getWithSchema<PositionManager>(
			this.getKey(poolAddress),
			this.schema,
		);
		return createMutablePositionManagerinstance(
			positionManager,
			ctx,
			this.stores,
			this.events,
			this.tokenMethod!,
			this.nftMethod!,
			this.chainId,
		);
	}

	private _checkDependencies() {
		if (!this.dependencyReady) {
			throw new Error('dependencies not configured');
		}
	}

	public schema = positionManagerStoreSchema;

	private readonly events: NamedRegistry;
	private readonly stores: NamedRegistry;

	private chainId: Buffer = Buffer.alloc(0);
	private tokenMethod: TokenMethod | undefined;
	private nftMethod: NFTMethod | undefined;

	private dependencyReady = false;
}
