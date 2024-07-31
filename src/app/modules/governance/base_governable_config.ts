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
import { ConfigPathKeys, ConfigPathType, GovernableConfigStoreData, GovernableConfigVerifyContext, UpdatedProperty } from './types';
import { governableConfigSchema } from './schema';
import { getUpdatedProperties, getValueFromPath, pathExists, updateValueFromPath } from './utils';
import { ConfigUpdatedEvent } from './events/config_updated';
import { GovernanceMethod } from './method';

/**
 * The `BaseGovernableConfig` provides a framework for implementing on-chain configurations that can be managed through proposals in the `governance` module.
 */
export abstract class BaseGovernableConfig<T extends object> extends BaseStore<GovernableConfigStoreData> {
	protected genesisConfig: GenesisConfig | undefined;
	protected storeKey = Buffer.alloc(0);
	protected events: NamedRegistry = new NamedRegistry();
	protected registered: boolean = false;
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
	 * Hook called before the configuration initialization.
	 * Should be extended by children class as needed
	 *
	 * @param _genesisConfig - The genesis configuration.
	 */
	public beforeConfigInit(_genesisConfig: GenesisConfig): void {}

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
	 *
	 * @param args - The initialization arguments including the genesis configuration and module configuration.
	 */
	public init(args: ModuleInitArgs): void {
		this.beforeConfigInit(args.genesisConfig);
		this.default = utils.objects.mergeDeep({}, this.default, args.moduleConfig) as T;
	}

	/**
	 * Initializes the genesis state for the configuration.
	 * Should be called at module.initGenesisState()
	 *
	 * @param context - The genesis block execution context.
	 */
	public async initConfig(context: BlockExecuteContext): Promise<void> {
		if (await this.has(context, this.storeKey)) return;

		if (Object.keys(this.schema.properties).length === 0) throw new Error(`schema for ${this.name} is not configured`);

		await this.setConfig(context.getMethodContext(), this.default);
	}

	/**
	 * Retrieves the current on-chain configuration.
	 *
	 * @param ctx - The context for retrieving the immutable store.
	 * @returns The current configuration.
	 */
	public async getConfig(ctx: ImmutableStoreGetter): Promise<T> {
		const configStore = await this.get(ctx, this.storeKey);
		return codec.decode<T>(this.schema, configStore.data);
	}

	/**
	 * Sets the on-chain configuration.
	 *
	 * @param ctx - The context for setting the store.
	 * @param value - The new configuration value.
	 */
	public async setConfig(ctx: MethodContext, value: T): Promise<void> {
		if (!this.genesisConfig) throw new Error(`${this.name} genesis config is not initialized`);

		const verify = await this.verify({ context: ctx, config: value, genesisConfig: this.genesisConfig });
		if (verify.status !== VerifyStatus.OK) throw new Error(`failed to verify governable config for ${this.name}: ${verify.error ? verify.error.message : 'unknown'}`);
		validator.validator.validate<T>(this.schema, value);

		let oldConfig: object = {};
		if (await this.has(ctx, this.storeKey)) oldConfig = (await this.getConfig(ctx)) as T;

		await this.set(ctx, this.storeKey, { data: codec.encode(this.schema, value) });

		if (this.registered) {
			const events = this.events.get(ConfigUpdatedEvent);
			const updatedPaths = getUpdatedProperties(oldConfig, value, this.schema);

			updatedPaths.forEach(updated => {
				events.add(
					ctx,
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
		}
	}

	/**
	 * Retrieves an on-chain configuration value using a dot-separated path.
	 *
	 * @param ctx - The context for retrieving the immutable store.
	 * @param path - The dot-separated path to the configuration value.
	 * @returns The value at the specified path in the configuration.
	 * @throws Will throw an error if the path does not exist in the configuration.
	 */
	public async getConfigWithPath<P extends ConfigPathKeys<T>>(ctx: ImmutableStoreGetter, path: P): Promise<ConfigPathType<T, P>> {
		const config = (await this.getConfig(ctx)) as T;
		if (!pathExists(config, path)) {
			throw new Error(`config with path ${path} on ${this.name} dosen't exists`);
		}
		const ret = getValueFromPath(config, path);
		return ret;
	}

	/**
	 * Sets the on-chain configuration value using a dot-separated path.
	 *
	 * @param ctx - The context for setting the store.
	 * @param path - The dot-separated path to the configuration value.
	 * @param value - The value to set at the specified path.
	 * @throws Will throw an error if the path does not exist in the configuration.
	 */
	public async setConfigWithPath<P extends ConfigPathKeys<T>>(ctx: MethodContext, path: P, value: ConfigPathType<T, P>): Promise<void> {
		const config = (await this.getConfig(ctx)) as T;
		if (!pathExists(config, path)) {
			throw new Error(`config with path ${path} on ${this.name} dosen't exists`);
		}
		const updatedConfig = updateValueFromPath(config, path, value);
		await this.setConfig(ctx, updatedConfig);
	}

	/**
	 * Dry running set the on-chain configuration.
	 *
	 * @param ctx - The context for setting the store.
	 * @param value - The new configuration value.
	 */
	public async dryRunSetConfig(ctx: MethodContext, value: T): Promise<UpdatedProperty[]> {
		if (!this.genesisConfig) throw new Error(`${this.name} genesis config is not initialized`);

		const verify = await this.verify({ context: ctx, config: value, genesisConfig: this.genesisConfig });
		if (verify.status !== VerifyStatus.OK) throw new Error(`failed to verify governable config for ${this.name}: ${verify.error ? verify.error.message : 'unknown'}`);
		validator.validator.validate<T>(this.schema, value);

		let oldConfig: object = {};
		if (await this.has(ctx, this.storeKey)) oldConfig = (await this.getConfig(ctx)) as T;

		if (this.registered) {
			const updatedPaths = getUpdatedProperties(oldConfig, value, this.schema);
			return updatedPaths;
		}

		return [];
	}

	/**
	 * Dry running set the on-chain configuration value using a dot-separated path.
	 *
	 * @param ctx - The context for setting the store.
	 * @param path - The dot-separated path to the configuration value.
	 * @param value - The value to set at the specified path.
	 * @throws Will throw an error if the path does not exist in the configuration.
	 */
	public async dryRunSetConfigWithPath<P extends ConfigPathKeys<T>>(ctx: MethodContext, path: P, value: ConfigPathType<T, P>): Promise<UpdatedProperty[]> {
		const config = (await this.getConfig(ctx)) as T;
		if (!pathExists(config, path)) {
			throw new Error(`config with path ${path} on ${this.name} dosen't exists`);
		}
		const updatedConfig = updateValueFromPath(config, path, value);
		return this.dryRunSetConfig(ctx, updatedConfig);
	}

	// Below this are Klayr SDK BaseStore overriden implementation

	public async get(ctx: ImmutableStoreGetter, key: Buffer): Promise<GovernableConfigStoreData> {
		const subStore = ctx.getStore(this.storePrefix, this.subStorePrefix);
		return subStore.getWithSchema<GovernableConfigStoreData>(key, governableConfigSchema);
	}

	public async has(ctx: ImmutableStoreGetter, key: Buffer): Promise<boolean> {
		const subStore = ctx.getStore(this.storePrefix, this.subStorePrefix);
		return subStore.has(key);
	}

	public async iterate(ctx: ImmutableStoreGetter, options: IterateOptions): Promise<{ key: Buffer; value: GovernableConfigStoreData }[]> {
		const subStore = ctx.getStore(this.storePrefix, this.subStorePrefix);
		return subStore.iterateWithSchema<GovernableConfigStoreData>(options, governableConfigSchema);
	}

	public async set(ctx: StoreGetter, key: Buffer, value: GovernableConfigStoreData): Promise<void> {
		const subStore = ctx.getStore(this.storePrefix, this.subStorePrefix);
		return subStore.setWithSchema(key, value, governableConfigSchema);
	}

	public async del(ctx: StoreGetter, key: Buffer): Promise<void> {
		const subStore = ctx.getStore(this.storePrefix, this.subStorePrefix);
		return subStore.del(key);
	}
}
