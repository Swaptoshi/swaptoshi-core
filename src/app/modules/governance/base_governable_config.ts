/* eslint-disable import/no-cycle */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/member-ordering */
/* eslint-disable import/no-extraneous-dependencies */

import { Schema, validator, utils, codec, Modules, Types, StateMachine } from 'klayr-sdk';
import { emptySchema } from '@klayr/codec';
import { IterateOptions } from '@liskhq/lisk-db';
import { ConfigPathKeys, ConfigPathType, GovernableConfigSetContext, GovernableConfigStoreData, GovernableConfigVerifyContext, UpdatedProperty } from './types';
import { governableConfigSchema } from './schema';
import { getSchemaByPath, getUpdatedProperties, getValueFromPath, pathExists, removeProperty, updateValueFromPath } from './utils';
import { ConfigUpdatedEvent } from './events/config_updated';
import { GovernanceMethod } from './method';

/**
 * The `BaseGovernableConfig` provides a framework for implementing on-chain configurations that can be managed through proposals in the `governance` module.
 */
export abstract class BaseGovernableConfig<T extends object> extends Modules.BaseStore<GovernableConfigStoreData> {
	protected storeKey = Buffer.alloc(0);
	protected governanceEvent: Modules.NamedRegistry = new Modules.NamedRegistry();
	protected module: string = '';
	protected method: GovernanceMethod | undefined;

	public constructor(moduleName: string, index: number) {
		super(moduleName, index);
		this.module = moduleName;
	}

	/**
	 * Indicates whether this instance is registered as a governable config in the governance module.
	 * If false, this instance will function as a standard in-memory config sourced from config.json.
	 */
	public registered: boolean = false;

	/**
	 * Whether this instance is initialized and ready to use.
	 */
	public initialized: boolean = false;

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
	public genesisConfig: Types.GenesisConfig | undefined;

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
	public register(events: Modules.NamedRegistry, governanceMethod: GovernanceMethod, args: Modules.ModuleInitArgs) {
		this.governanceEvent = events;
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
	public beforeConfigInit(_genesisConfig: Types.GenesisConfig): void {}

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
	public async verify(_context: GovernableConfigVerifyContext<T>): Promise<StateMachine.VerificationResult> {
		return { status: StateMachine.VerifyStatus.OK };
	}

	/**
	 * Initializes the module with the provided configuration arguments.
	 * Should be called if config is not registered
	 *
	 * @param args - The initialization arguments including the genesis configuration and module configuration.
	 */
	public init(args: Modules.ModuleInitArgs): void {
		this.beforeConfigInit(args.genesisConfig);
		this.default = utils.objects.mergeDeep({}, this.default, args.moduleConfig) as T;

		// verify all properties on assigned config is defined on the schema
		validator.validator.validate(removeProperty(this.schema, ['governable']) as Schema, this.default);
		getUpdatedProperties({}, this.default, this.schema);

		this.initialized = true;
	}

	/**
	 * Initializes the genesis state for the configuration.
	 * Should be called at module.initGenesisState()
	 *
	 * @param context - The genesis block execution context.
	 */
	public async initRegisteredConfig(context: StateMachine.BlockExecuteContext): Promise<void> {
		if (await this.has(context, this.storeKey)) return;

		if (Object.keys(this.schema.properties).length === 0) throw new Error(`schema for ${this.name} is not configured`);

		await this._setConfigHandler(context.getMethodContext(), this.default, true, false);
	}

	/**
	 * Retrieves the current on-chain configuration.
	 * Will use in-memory config, if config is not registered as governable
	 *
	 * @param context - The context for retrieving the immutable store.
	 * @returns The current configuration.
	 */
	public async getConfig(context: Modules.ImmutableStoreGetter): Promise<T> {
		if (!this.initialized) throw new Error(`${this.name} config not initialized. Call .init() in module.init() if not governable.`);

		if (this.registered) {
			const configStore = await this.get(context, this.storeKey);
			return codec.decode<T>(removeProperty(this.schema, ['governable']) as Schema, configStore.data);
		}
		return this.default;
	}

	/**
	 * Sets the on-chain configuration.
	 *
	 * @param context - The context for setting the store.
	 * @param value - The new configuration value.
	 */
	public async setConfig(context: StateMachine.MethodContext, value: T): Promise<void> {
		await this._setConfigHandler(context, value, true, true);
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
	public async getConfigWithPath<P extends ConfigPathKeys<T>>(context: Modules.ImmutableStoreGetter, path: P): Promise<ConfigPathType<T, P>> {
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
	public async setConfigWithPath<P extends ConfigPathKeys<T>>(context: StateMachine.MethodContext, path: P, value: ConfigPathType<T, P>): Promise<void> {
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
	public async dryRunSetConfig(context: StateMachine.ImmutableMethodContext, value: T): Promise<UpdatedProperty[]> {
		return this._setConfigHandler(context as StateMachine.MethodContext, value, false, true);
	}

	/**
	 * Dry running set the on-chain configuration value using a dot-separated path.
	 *
	 * @param context - The context for setting the store.
	 * @param path - The dot-separated path to the configuration value.
	 * @param value - The value to set at the specified path.
	 * @throws Will throw an error if the path does not exist in the configuration.
	 */
	public async dryRunSetConfigWithPath<P extends ConfigPathKeys<T>>(context: StateMachine.ImmutableMethodContext, path: P, value: ConfigPathType<T, P>): Promise<UpdatedProperty[]> {
		const config = (await this.getConfig(context)) as T;
		if (!pathExists(config, path)) {
			throw new Error(`config with path ${path} on ${this.name} dosen't exists`);
		}
		const updatedConfig = updateValueFromPath(config, path, value);
		return this.dryRunSetConfig(context, updatedConfig);
	}

	/**
	 * Handler of setConfig function
	 *
	 * @param context - The context for setting the store.
	 * @param value - The new config
	 * @param mutateState - Whether blockchain state will be mutated, or just dryRunning
	 * @param verifyGovernability - Whether governable props will be strictly checked
	 * @throws Will throw an error if: instance is not configured, verify failed, invalid schema, or non-governable props found (in case verifyGovernability is true).
	 */
	private async _setConfigHandler(context: StateMachine.MethodContext, value: T, mutateState: boolean, verifyGovernability: boolean) {
		if (!this.initialized) throw new Error(`${this.name} config not initialized. Call .init() in module.init() if not governable.`);
		if (!this.genesisConfig) throw new Error(`${this.name} genesis config is not registered`);

		const verify = await this.verify({ context, config: value, genesisConfig: this.genesisConfig });
		if (verify.status !== StateMachine.VerifyStatus.OK) throw new Error(`failed to verify governable config for ${this.name}: ${verify.error ? verify.error.message : 'unknown'}`);
		validator.validator.validate<T>(removeProperty(this.schema, ['governable']) as Schema, value);

		let updatedPaths: UpdatedProperty[] = [];

		let oldConfig: T = {} as T;
		if (await this.has(context, this.storeKey)) oldConfig = (await this.getConfig(context)) as T;

		if (mutateState) await this.beforeSetConfig({ ...context, oldConfig, newConfig: value });

		if (this.registered) {
			updatedPaths = getUpdatedProperties(oldConfig, value, this.schema);

			if (verifyGovernability) {
				for (const updatedPath of updatedPaths) {
					if ((getSchemaByPath(this.schema, updatedPath.path) as Schema & { governable?: boolean }).governable === false) {
						throw new Error(`attempt to modify non-governable config: ${updatedPath.path}`);
					}
				}
			}

			if (mutateState) {
				await this.set(context, this.storeKey, { data: codec.encode(removeProperty(this.schema, ['governable']) as Schema, value) });

				const events = this.governanceEvent.get(ConfigUpdatedEvent);

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
			}
		} else if (mutateState) this.default = value;

		if (mutateState) await this.afterSetConfig({ ...context, oldConfig, newConfig: value });

		return updatedPaths;
	}

	// Below this are Klayr SDK BaseStore overriden implementation

	public async get(context: Modules.ImmutableStoreGetter, key: Buffer): Promise<GovernableConfigStoreData> {
		const subStore = context.getStore(this.storePrefix, this.subStorePrefix);
		return subStore.getWithSchema<GovernableConfigStoreData>(key, governableConfigSchema);
	}

	public async has(context: Modules.ImmutableStoreGetter, key: Buffer): Promise<boolean> {
		const subStore = context.getStore(this.storePrefix, this.subStorePrefix);
		return subStore.has(key);
	}

	public async iterate(context: Modules.ImmutableStoreGetter, options: IterateOptions): Promise<{ key: Buffer; value: GovernableConfigStoreData }[]> {
		const subStore = context.getStore(this.storePrefix, this.subStorePrefix);
		return subStore.iterateWithSchema<GovernableConfigStoreData>(options, governableConfigSchema);
	}

	public async set(context: Modules.StoreGetter, key: Buffer, value: GovernableConfigStoreData): Promise<void> {
		const subStore = context.getStore(this.storePrefix, this.subStorePrefix);
		return subStore.setWithSchema(key, value, governableConfigSchema);
	}

	public async del(context: Modules.StoreGetter, key: Buffer): Promise<void> {
		const subStore = context.getStore(this.storePrefix, this.subStorePrefix);
		return subStore.del(key);
	}
}
