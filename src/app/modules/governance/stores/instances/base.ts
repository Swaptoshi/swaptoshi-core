/* eslint-disable import/no-cycle */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { BaseStore, GenesisConfig, JSONObject, NamedRegistry, TokenMethod } from 'klayr-sdk';
import { Constructor, ImmutableContext, ImmutableGovernanceContext, MutableGovernanceContext } from '../../types';
import { GovernanceGovernableConfig } from '../../config';
import { GovernanceInternalMethod } from '../../internal_method';

export interface AddDependenciesParam<T extends ImmutableGovernanceContext | MutableGovernanceContext> {
	context: T;
	tokenMethod?: TokenMethod;
	internalMethod?: GovernanceInternalMethod;
}

export class BaseInstance<T, K extends BaseStore<T>> {
	public constructor(storeKey: Constructor, stores: NamedRegistry, events: NamedRegistry, config: GovernanceGovernableConfig, genesisConfig: GenesisConfig, moduleName: string, key?: Buffer) {
		this.stores = stores;
		this.events = events;
		this.moduleName = moduleName;
		this.config = config;
		this.genesisConfig = genesisConfig;
		this.instanceStore = stores.get(storeKey) as unknown as K;
		if (key) this.key = key;
	}

	public toJSON(): JSONObject<T> {
		throw new Error('toJSON() method is not implemented');
	}

	public toObject(): T {
		throw new Error('toObject() method is not implemented');
	}

	public addImmutableDependencies(param: AddDependenciesParam<ImmutableGovernanceContext>) {
		if (this.mutableDependencyReady || this.immutableDependencyReady) {
			throw new Error('this instance dependencies already been configured');
		}

		const { context, ...methods } = param;
		Object.assign(this, methods);

		this.immutableContext = context;
		this.immutableDependencyReady = true;
	}

	public addMutableDependencies(param: AddDependenciesParam<MutableGovernanceContext>) {
		if (this.mutableDependencyReady || this.immutableDependencyReady) {
			throw new Error('this instance dependencies already been configured');
		}

		const { context, ...methods } = param;
		Object.assign(this, methods);

		this.mutableContext = context;
		this.context = context;
		this.immutableContext = context;

		this.mutableDependencyReady = true;
		this.immutableDependencyReady = true;
	}

	public addDependencies(param: AddDependenciesParam<MutableGovernanceContext>) {
		this.addMutableDependencies(param);
	}

	public async getConfig(context: ImmutableContext) {
		const config = await this.config.getConfig(context);
		return config;
	}

	protected _checkMutableDependencies() {
		if (!this.mutableDependencyReady) {
			throw new Error('dependencies not configured');
		}
	}

	protected _checkImmutableDependencies() {
		if (!this.immutableDependencyReady) {
			throw new Error('dependencies not configured');
		}
	}

	protected _checkDependencies() {
		this._checkMutableDependencies();
	}

	protected _setKey(key: Buffer) {
		this.key = key;
	}

	protected async _saveStore() {
		this._checkMutableDependencies();

		if (this.key.compare(Buffer.alloc(0)) === 0) {
			throw new Error("instance _saveStore() can't store data with empty buffer as key");
		}

		await this.instanceStore.set(this.mutableContext!.context, this.key, this.toObject());
	}

	protected readonly instanceStore: K;
	protected readonly stores: NamedRegistry;
	protected readonly events: NamedRegistry;
	protected readonly genesisConfig: GenesisConfig;
	protected readonly moduleName: string;
	protected readonly config: GovernanceGovernableConfig;

	protected readonly tokenMethod: TokenMethod | undefined;
	protected readonly internalMethod: GovernanceInternalMethod | undefined;

	protected context: MutableGovernanceContext | undefined;
	protected immutableContext: ImmutableGovernanceContext | undefined;
	protected mutableContext: MutableGovernanceContext | undefined;
	protected mutableDependencyReady = false;
	protected immutableDependencyReady = false;

	protected key: Buffer = Buffer.alloc(0);
}
