/* eslint-disable */
import { BaseMethod } from 'klayr-sdk';
import { GovernableConfigRegistry } from './registry';
import { BaseGovernableConfig } from './base_governable_config';

export class GovernanceMethod extends BaseMethod {
	private _governableConfig: GovernableConfigRegistry | undefined;

	public init(governableConfig: GovernableConfigRegistry) {
		this._governableConfig = governableConfig;
	}

	public async register(module: string, governableConfig: BaseGovernableConfig<any>): Promise<void> {
		if (!this._governableConfig) throw new Error('GovernanceMethod is not initialized');
		governableConfig.register(this.events);
		this._governableConfig.register(module, governableConfig);
	}
}
