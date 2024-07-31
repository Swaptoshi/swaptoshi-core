/* eslint-disable */
import { BaseMethod, MethodContext, ModuleInitArgs } from 'klayr-sdk';
import { GovernableConfigRegistry } from './registry';
import { BaseGovernableConfig } from './base_governable_config';
import { GovernanceGovernableConfig } from './config';

export class GovernanceMethod extends BaseMethod {
	private _governableConfig: GovernableConfigRegistry | undefined;

	public init(governableConfig: GovernableConfigRegistry) {
		this._governableConfig = governableConfig;
	}

	public registerGovernableConfig(args: ModuleInitArgs, moduleName: string, governableConfig: BaseGovernableConfig<any>): void {
		if (!this._governableConfig) throw new Error('GovernanceMethod is not initialized');
		governableConfig.register(this.events, this, args);
		this._governableConfig.register(moduleName, governableConfig);
	}

	public getGovernableConfig<T extends object>(module: string): BaseGovernableConfig<T> {
		if (!this._governableConfig) throw new Error('GovernanceMethod is not initialized');
		return this._governableConfig.get(module) as BaseGovernableConfig<T>;
	}

	public async getGovernanceConfig(context: MethodContext) {
		const configStore = this.stores.get(GovernanceGovernableConfig);
		const config = await configStore.getConfig(context);
		return config;
	}
}
