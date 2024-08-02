/* eslint-disable camelcase */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { ModuleInitArgs, MethodContext } from 'klayr-sdk';
import { MockedGovernanceMethod, mock_get_governable_config, mock_get_governance_config, mock_governance_init, mock_register_governable_config, mock_unregister_governable_config } from '.';
import { BaseGovernableConfig } from '../../../../../../../src/app/modules/governance';
import { GovernableConfigRegistry } from '../../../../../../../src/app/modules/governance/registry';

describe('MockedGovernanceMethod', () => {
	let governanceMethod: MockedGovernanceMethod;

	beforeEach(() => {
		governanceMethod = new MockedGovernanceMethod();
	});

	describe('init', () => {
		it('should call mock functions', () => {
			const governableConfigRegistry = {} as GovernableConfigRegistry;
			governanceMethod.init(governableConfigRegistry);
			expect(mock_governance_init).toHaveBeenCalledWith(governableConfigRegistry);
		});
	});

	describe('registerGovernableConfig', () => {
		it('should call mock functions', () => {
			const args = {} as ModuleInitArgs;
			const moduleName = 'moduleName';
			const governableConfig = {} as BaseGovernableConfig<any>;
			governanceMethod.registerGovernableConfig(args, moduleName, governableConfig);
			expect(mock_register_governable_config).toHaveBeenCalledWith(args, moduleName, governableConfig);
		});
	});

	describe('unregisterGovernableConfig', () => {
		it('should call mock functions', () => {
			const moduleName = 'moduleName';
			const governableConfig = {} as BaseGovernableConfig<any>;
			governanceMethod.unregisterGovernableConfig(moduleName, governableConfig);
			expect(mock_unregister_governable_config).toHaveBeenCalledWith(moduleName, governableConfig);
		});
	});

	describe('getGovernableConfig', () => {
		it('should call mock functions', () => {
			const module = 'module';
			governanceMethod.getGovernableConfig(module);
			expect(mock_get_governable_config).toHaveBeenCalledWith(module);
		});
	});

	describe('getGovernanceConfig', () => {
		it('should call mock functions', async () => {
			const context = {} as MethodContext;
			await governanceMethod.getGovernanceConfig(context);
			expect(mock_get_governance_config).toHaveBeenCalledWith(context);
		});
	});
});
