/* eslint-disable import/no-cycle */
import { Modules, Types, db, utils } from 'klayr-sdk';
import { GovernanceGovernableConfig } from '../config';
import { GovernableConfigRegistry } from '../registry';
import { GovernanceInternalMethod } from '../internal_method';
import { TokenMethod } from '../types';

interface AddDependenciesParam {
	tokenMethod: TokenMethod;
	governableConfigRegistry?: GovernableConfigRegistry;
	internalMethod?: GovernanceInternalMethod;
}

export class BaseStoreWithInstance<T> extends Modules.BaseStore<T> {
	public constructor(moduleName: string, index: number, stores: Modules.NamedRegistry, events: Modules.NamedRegistry) {
		super(moduleName, index);
		this.stores = stores;
		this.events = events;
		this.moduleName = moduleName;
	}

	public getDefault() {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call
		return this.default ? (utils.objects.cloneDeep(this.default) as T) : undefined;
	}

	public async getOrDefault(context: Modules.ImmutableStoreGetter, key: Buffer): Promise<T> {
		try {
			const store = await this.get(context, key);
			return store;
		} catch (error) {
			if (!(error instanceof db.NotFoundError)) {
				throw error;
			}
			return { ...this.getDefault() } as T;
		}
	}

	public async getOrUndefined(context: Modules.ImmutableStoreGetter, key: Buffer): Promise<T | undefined> {
		try {
			const store = await this.get(context, key);
			return store;
		} catch (error) {
			if (!(error instanceof db.NotFoundError)) {
				throw error;
			}
			return undefined;
		}
	}

	public addDependencies(params: AddDependenciesParam) {
		Object.assign(this, params);
		if (this.genesisConfig !== undefined && this.config !== undefined) this.dependencyReady = true;
	}

	public init(genesisConfig: Types.GenesisConfig, governableConfig: GovernanceGovernableConfig) {
		this.genesisConfig = genesisConfig;
		this.config = governableConfig;
		if (this.tokenMethod !== undefined) this.dependencyReady = true;
	}

	protected _checkDependencies() {
		if (!this.dependencyReady) {
			throw new Error('dependencies not configured');
		}
	}

	protected readonly events: Modules.NamedRegistry;
	protected readonly stores: Modules.NamedRegistry;
	protected readonly moduleName: string;

	protected tokenMethod: TokenMethod | undefined;
	protected governableConfigRegistry: GovernableConfigRegistry | undefined;
	protected internalMethod: GovernanceInternalMethod | undefined;

	protected genesisConfig: Types.GenesisConfig | undefined = undefined;
	protected config: GovernanceGovernableConfig | undefined = undefined;
	protected dependencyReady = false;

	protected readonly default: T | undefined = undefined;
}
