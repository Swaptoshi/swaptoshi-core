import {
	BaseStore,
	FeeMethod,
	GenesisConfig,
	ImmutableStoreGetter,
	NamedRegistry,
	TokenMethod,
	db,
} from 'lisk-sdk';
import { TokenFactoryModuleConfig } from '../types';
import { DexMethod } from '../../dex/method';

interface AddDependenciesParam {
	tokenMethod?: TokenMethod;
	feeMethod?: FeeMethod;
	dexMethod?: DexMethod;
}

export class BaseStoreWithInstance<T> extends BaseStore<T> {
	public constructor(
		moduleName: string,
		index: number,
		stores: NamedRegistry,
		events: NamedRegistry,
	) {
		super(moduleName, index);
		this.stores = stores;
		this.events = events;
		this.moduleName = moduleName;
	}

	public getDefault() {
		return this.default ? Object.freeze<T>(this.default) : undefined;
	}

	public async getOrDefault(context: ImmutableStoreGetter, key: Buffer): Promise<T> {
		try {
			const factory = await this.get(context, key);
			return factory;
		} catch (error) {
			if (!(error instanceof db.NotFoundError)) {
				throw error;
			}
			return { ...this.getDefault() } as T;
		}
	}

	public async getOrUndefined(context: ImmutableStoreGetter, key: Buffer): Promise<T | undefined> {
		try {
			const factory = await this.get(context, key);
			return factory;
		} catch (error) {
			if (!(error instanceof db.NotFoundError)) {
				throw error;
			}
			return undefined;
		}
	}

	public addDependencies(params: AddDependenciesParam) {
		Object.assign(this, params);
		if (this.genesisConfig !== undefined && this.factoryConfig !== undefined)
			this.dependencyReady = true;
	}

	public init(genesisConfig: GenesisConfig, factoryConfig: TokenFactoryModuleConfig) {
		this.genesisConfig = genesisConfig;
		this.factoryConfig = factoryConfig;
		if (this.tokenMethod !== undefined && this.feeMethod !== undefined) this.dependencyReady = true;
	}

	protected _checkDependencies() {
		if (!this.dependencyReady) {
			throw new Error('dependencies not configured');
		}
	}

	protected readonly events: NamedRegistry;
	protected readonly stores: NamedRegistry;
	protected readonly moduleName: string;

	protected tokenMethod: TokenMethod | undefined;
	protected feeMethod: FeeMethod | undefined;
	protected dexMethod: DexMethod | undefined;

	protected genesisConfig: GenesisConfig | undefined = undefined;
	protected factoryConfig: TokenFactoryModuleConfig | undefined = undefined;
	protected dependencyReady = false;

	protected readonly default: T | undefined = undefined;
}
