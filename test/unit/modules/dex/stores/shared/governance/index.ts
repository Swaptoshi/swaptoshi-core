/* eslint-disable camelcase */
/* eslint-disable @typescript-eslint/require-await */
import { MethodContext, ModuleInitArgs } from 'klayr-sdk';
import { GovernableConfigRegistry } from '../../../../../../../src/app/modules/governance/registry';
import { BaseGovernableConfig } from '../../../../../../../src/app/modules/governance';

export const mock_governance_init = jest.fn();
export const mock_register_governable_config = jest.fn();
export const mock_unregister_governable_config = jest.fn();
export const mock_get_governable_config = jest.fn();
export const mock_get_governance_config = jest.fn();

export class MockedGovernanceMethod {
	public init(governableConfig: GovernableConfigRegistry): void {
		mock_governance_init(governableConfig);
	}

	public registerGovernableConfig(args: ModuleInitArgs, moduleName: string, governableConfig: BaseGovernableConfig<any>): void {
		governableConfig.init(args);
		mock_register_governable_config(args, moduleName, governableConfig);
	}

	public unregisterGovernableConfig(moduleName: string, governableConfig: BaseGovernableConfig<any>): void {
		mock_unregister_governable_config(moduleName, governableConfig);
	}

	public getGovernableConfig<T extends object>(module: string): BaseGovernableConfig<T> {
		return mock_get_governable_config(module) as BaseGovernableConfig<T>;
	}

	public async getGovernanceConfig(context: MethodContext) {
		return mock_get_governance_config(context);
	}
}
