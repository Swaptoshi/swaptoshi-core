/* eslint-disable */
import { BaseMethod, MethodContext } from 'klayr-sdk';
import { GovernableConfigRegistry } from './registry';
import { BaseGovernableConfig } from './base_governable_config';
import { GovernanceGovernableConfig } from './config';

export class GovernanceMethod extends BaseMethod {
	private _governableConfig: GovernableConfigRegistry | undefined;

	public init(governableConfig: GovernableConfigRegistry) {
		this._governableConfig = governableConfig;
	}

	public registerGovernableConfig(module: string, governableConfig: BaseGovernableConfig<any>): void {
		if (!this._governableConfig) throw new Error('GovernanceMethod is not initialized');
		governableConfig.register(this.events, this);
		this._governableConfig.register(module, governableConfig);
	}

	public async getGovernanceConfig(context: MethodContext) {
		const configStore = this.stores.get(GovernanceGovernableConfig);
		const config = await configStore.getConfig(context);
		return config;
	}
}
