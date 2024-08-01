/* eslint-disable import/no-cycle */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/member-ordering */
/* eslint-disable import/no-extraneous-dependencies */

import {
	ImmutableStoreGetter,
	GenesisConfig,
	ModuleInitArgs,
	StoreGetter,
	BaseStore,
	Schema,
	NamedRegistry,
	validator,
	utils,
	codec,
	MethodContext,
	VerificationResult,
	VerifyStatus,
	BlockExecuteContext,
} from 'klayr-sdk';
import { emptySchema } from '@klayr/codec';
import { IterateOptions } from '@liskhq/lisk-db';
import { ConfigPathKeys, ConfigPathType, GovernableConfigSetContext, GovernableConfigStoreData, GovernableConfigVerifyContext, UpdatedProperty } from './types';
import { governableConfigSchema } from './schema';
import { getUpdatedProperties, getValueFromPath, pathExists, updateValueFromPath } from './utils';
import { ConfigUpdatedEvent } from './events/config_updated';
import { GovernanceMethod } from './method';

/**
 * The `BaseGovernableConfig` provides a framework for implementing on-chain configurations that can be managed through proposals in the `governance` module.
 */
export abstract class BaseGovernableConfig<T extends object> extends BaseStore<GovernableConfigStoreData> {
	protected storeKey = Buffer.alloc(0);
	protected events: NamedRegistry = new NamedRegistry();
	protected registered: boolean = false;
	protected initialized: boolean = false;
	protected module: string = '';
	protected method: GovernanceMethod | undefined;

	public constructor(moduleName: string, index: number) {
		super(moduleName, index);
		this.module = moduleName;
	}

	/**
	 * The schema defining the structure of the governable configuration.
	 */
	public schema: Schema = emptySchema;

	/**
	 * The default configuration values.
	 */
	public default: T = {} as T;

	/**
	 * The chain genesis configuration.
	 */
	public genesisConfig: GenesisConfig | undefined;

	/**
	 * The governable config name is the unique identifier for the config.
	 *
	 * The governable config name is automatically calculated from the class name of the method:
	 * The `GovernableConfig` suffix of the class name is removed, and the first character is converted to lowercase.
	 */
	public get name(): string {
		const name = this.constructor.name.replace('GovernableConfig', '');
		return name.charAt(0).toLowerCase() + name.substring(1);
	}

	/**
	 * Registers the events associated with the governable config.
	 *
	 * @param events - The registry of named events.
	 * @param treasuryAddress - The treasury address, as configured on governance module.
	 */
	public register(events: NamedRegistry, governanceMethod: GovernanceMethod, args: ModuleInitArgs) {
		this.events = events;
		this.method = governanceMethod;
		this.genesisConfig = args.genesisConfig;
		this.init(args);
		this.registered = true;
	}

	/**
	 * Unregisters the events associated with the governable config.
	 *
	 * @param events - The registry of named events.
	 * @param treasuryAddress - The treasury address, as configured on governance module.
	 */
	public unregister() {
		this.method = undefined;
		this.genesisConfig = undefined;
		this.registered = false;
	}

	/**
	 * Hook called before the configuration initialization.
	 * Should be extended by children class as needed
	 *
	 * @param _genesisConfig - The genesis configuration.
	 */
	public beforeConfigInit(_genesisConfig: GenesisConfig): void {}

	/**
	 * Hook called before on-chain config is changed.
	 * Should be extended by children class as needed
	 *
	 * @param _context - The before set config context, consist of MethodContext & config.
	 */
	public async beforeSetConfig(_context: GovernableConfigSetContext<T>): Promise<void> {}

	/**
	 * Hook called after on-chain config is changed.
	 * Should be extended by children class as needed
	 *
	 * @param _context - The after set config context, consist of MethodContext & config.
	 */
	public async afterSetConfig(_context: GovernableConfigSetContext<T>): Promise<void> {}

	/**
	 * Hook called before the storing on-chain configuration.
	 * Required to be extended by children class
	 *
	 * @param _context - The config verify context.
	 */
	// eslint-disable-next-line @typescript-eslint/require-await
	public async verify(_context: GovernableConfigVerifyContext<T>): Promise<VerificationResult> {
		return { status: VerifyStatus.OK };
	}

	/**
	 * Initializes the module with the provided configuration arguments.
	 * Should be called if config is not registered
	 *
	 * @param args - The initialization arguments including the genesis configuration and module configuration.
	 */
	public init(args: ModuleInitArgs): void {
		this.beforeConfigInit(args.genesisConfig);
		this.default = utils.objects.mergeDeep({}, this.default, args.moduleConfig) as T;
		validator.validator.validate(this.schema, this.default);
		this.initialized = true;
	}

	/**
	 * Initializes the genesis state for the configuration.
	 * Should be called at module.initGenesisState()
	 *
	 * @param context - The genesis block execution context.
	 */
	public async initRegisteredConfig(context: BlockExecuteContext): Promise<void> {
		if (await this.has(context, this.storeKey)) return;

		if (Object.keys(this.schema.properties).length === 0) throw new Error(`schema for ${this.name} is not configured`);

		await this.setConfig(context.getMethodContext(), this.default);
	}

	/**
	 * Retrieves the current on-chain configuration.
	 * Will use in-memory config, if config is not registered as governable
	 *
	 * @param context - The context for retrieving the immutable store.
	 * @returns The current configuration.
	 */
	public async getConfig(context: ImmutableStoreGetter): Promise<T> {
		if (!this.initialized) throw new Error(`${this.name} config not initialized. Call .init() in module.init() if not governable.`);

		if (this.registered) {
			const configStore = await this.get(context, this.storeKey);
			return codec.decode<T>(this.schema, configStore.data);
		}
		return this.default;
	}

	/**
	 * Sets the on-chain configuration.
	 *
	 * @param context - The context for setting the store.
	 * @param value - The new configuration value.
	 */
	public async setConfig(context: MethodContext, value: T): Promise<void> {
		if (!this.initialized) throw new Error(`${this.name} config not initialized. Call .init() in module.init() if not governable.`);
		if (!this.genesisConfig) throw new Error(`${this.name} genesis config is not registered`);

		const verify = await this.verify({ context, config: value, genesisConfig: this.genesisConfig });
		if (verify.status !== VerifyStatus.OK) throw new Error(`failed to verify governable config for ${this.name}: ${verify.error ? verify.error.message : 'unknown'}`);
		validator.validator.validate<T>(this.schema, value);

		if (this.registered) {
			let oldConfig: T = {} as T;
			if (await this.has(context, this.storeKey)) oldConfig = (await this.getConfig(context)) as T;

			await this.beforeSetConfig({ ...context, config: oldConfig });

			await this.set(context, this.storeKey, { data: codec.encode(this.schema, value) });

			const events = this.events.get(ConfigUpdatedEvent);
			const updatedPaths = getUpdatedProperties(oldConfig, value, this.schema);

			updatedPaths.forEach(updated => {
				events.add(
					context,
					{
						module: this.module,
						path: updated.path,
						old: updated.old,
						new: updated.new,
						type: updated.type,
					},
					[this.storePrefix],
				);
			});
		} else {
			this.default = value;
		}

		await this.afterSetConfig({ ...context, config: value });
	}

	/**
	 * Retrieves an on-chain configuration value using a dot-separated path.
	 * Will use in-memory config, if config is not registered as governable
	 *
	 * @param context - The context for retrieving the immutable store.
	 * @param path - The dot-separated path to the configuration value.
	 * @returns The value at the specified path in the configuration.
	 * @throws Will throw an error if the path does not exist in the configuration.
	 */
	public async getConfigWithPath<P extends ConfigPathKeys<T>>(context: ImmutableStoreGetter, path: P): Promise<ConfigPathType<T, P>> {
		const config = (await this.getConfig(context)) as T;
		if (!pathExists(config, path)) {
			throw new Error(`config with path ${path} on ${this.name} dosen't exists`);
		}
		const ret = getValueFromPath(config, path);
		return ret;
	}

	/**
	 * Sets the on-chain configuration value using a dot-separated path.
	 *
	 * @param context - The context for setting the store.
	 * @param path - The dot-separated path to the configuration value.
	 * @param value - The value to set at the specified path.
	 * @throws Will throw an error if the path does not exist in the configuration.
	 */
	public async setConfigWithPath<P extends ConfigPathKeys<T>>(context: MethodContext, path: P, value: ConfigPathType<T, P>): Promise<void> {
		const config = (await this.getConfig(context)) as T;
		if (!pathExists(config, path)) {
			throw new Error(`config with path ${path} on ${this.name} dosen't exists`);
		}
		const updatedConfig = updateValueFromPath(config, path, value);
		await this.setConfig(context, updatedConfig);
	}

	/**
	 * Dry running set the on-chain configuration.
	 *
	 * @param context - The context for setting the store.
	 * @param value - The new configuration value.
	 */
	public async dryRunSetConfig(context: MethodContext, value: T): Promise<UpdatedProperty[]> {
		if (!this.initialized) throw new Error(`${this.name} config not initialized. Call .init() in module.init() if not governable.`);
		if (!this.genesisConfig) throw new Error(`${this.name} genesis config is not registered`);

		const verify = await this.verify({ context, config: value, genesisConfig: this.genesisConfig });
		if (verify.status !== VerifyStatus.OK) throw new Error(`failed to verify governable config for ${this.name}: ${verify.error ? verify.error.message : 'unknown'}`);
		validator.validator.validate<T>(this.schema, value);

		if (this.registered) {
			let oldConfig: object = {};
			if (await this.has(context, this.storeKey)) oldConfig = (await this.getConfig(context)) as T;

			const updatedPaths = getUpdatedProperties(oldConfig, value, this.schema);
			return updatedPaths;
		}

		return [];
	}

	/**
	 * Dry running set the on-chain configuration value using a dot-separated path.
	 *
	 * @param context - The context for setting the store.
	 * @param path - The dot-separated path to the configuration value.
	 * @param value - The value to set at the specified path.
	 * @throws Will throw an error if the path does not exist in the configuration.
	 */
	public async dryRunSetConfigWithPath<P extends ConfigPathKeys<T>>(context: MethodContext, path: P, value: ConfigPathType<T, P>): Promise<UpdatedProperty[]> {
		const config = (await this.getConfig(context)) as T;
		if (!pathExists(config, path)) {
			throw new Error(`config with path ${path} on ${this.name} dosen't exists`);
		}
		const updatedConfig = updateValueFromPath(config, path, value);
		return this.dryRunSetConfig(context, updatedConfig);
	}

	// Below this are Klayr SDK BaseStore overriden implementation

	public async get(context: ImmutableStoreGetter, key: Buffer): Promise<GovernableConfigStoreData> {
		const subStore = context.getStore(this.storePrefix, this.subStorePrefix);
		return subStore.getWithSchema<GovernableConfigStoreData>(key, governableConfigSchema);
	}

	public async has(context: ImmutableStoreGetter, key: Buffer): Promise<boolean> {
		const subStore = context.getStore(this.storePrefix, this.subStorePrefix);
		return subStore.has(key);
	}

	public async iterate(context: ImmutableStoreGetter, options: IterateOptions): Promise<{ key: Buffer; value: GovernableConfigStoreData }[]> {
		const subStore = context.getStore(this.storePrefix, this.subStorePrefix);
		return subStore.iterateWithSchema<GovernableConfigStoreData>(options, governableConfigSchema);
	}

	public async set(context: StoreGetter, key: Buffer, value: GovernableConfigStoreData): Promise<void> {
		const subStore = context.getStore(this.storePrefix, this.subStorePrefix);
		return subStore.setWithSchema(key, value, governableConfigSchema);
	}

	public async del(context: StoreGetter, key: Buffer): Promise<void> {
		const subStore = context.getStore(this.storePrefix, this.subStorePrefix);
		return subStore.del(key);
	}
}
