/* eslint-disable camelcase */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { ModuleInitArgs, MethodContext } from 'klayr-sdk';
import {
	MockedGovernanceMethod,
	mock_get_governable_config,
	mock_get_governance_config,
	mock_governance_init,
	mock_register_governable_config,
	mock_unregister_governable_config,
	mock_get_casted_vote,
	mock_get_base_vote_score,
	mock_create_proposal,
	mock_get_proposal,
	mock_get_proposal_queue,
	mock_get_boosted_account,
	mock_get_delegated_vote,
	mock_get_next_available_proposal_id,
	mock_get_config,
} from '.';
import { BaseGovernableConfig } from '../../../../../../../src/app/modules/governance';
import { GovernableConfigRegistry } from '../../../../../../../src/app/modules/governance/registry';

describe('MockedGovernanceMethod', () => {
	let governanceMethod: MockedGovernanceMethod;

	beforeEach(() => {
		governanceMethod = new MockedGovernanceMethod();
	});

	describe('init', () => {
		it('should call mock_governance_init', () => {
			const governableConfigRegistry = {} as GovernableConfigRegistry;
			governanceMethod.init(governableConfigRegistry);
			expect(mock_governance_init).toHaveBeenCalledWith(governableConfigRegistry);
		});
	});

	describe('registerGovernableConfig', () => {
		it('should call mock_register_governable_config', () => {
			const args = {} as ModuleInitArgs;
			const moduleName = 'moduleName';
			const governableConfig = { init: _args => {} } as BaseGovernableConfig<any>;
			governanceMethod.registerGovernableConfig(args, moduleName, governableConfig);
			expect(mock_register_governable_config).toHaveBeenCalledWith(args, moduleName, governableConfig);
		});
	});

	describe('unregisterGovernableConfig', () => {
		it('should call mock_unregister_governable_config', () => {
			const moduleName = 'moduleName';
			const governableConfig = {} as BaseGovernableConfig<any>;
			governanceMethod.unregisterGovernableConfig(moduleName, governableConfig);
			expect(mock_unregister_governable_config).toHaveBeenCalledWith(moduleName, governableConfig);
		});
	});

	describe('getGovernableConfig', () => {
		it('should call mock_get_governable_config', () => {
			const module = 'module';
			governanceMethod.getGovernableConfig(module);
			expect(mock_get_governable_config).toHaveBeenCalledWith(module);
		});
	});

	describe('getGovernanceConfig', () => {
		it('should call mock_get_governance_config', async () => {
			const context = {} as MethodContext;
			await governanceMethod.getGovernanceConfig(context);
			expect(mock_get_governance_config).toHaveBeenCalledWith(context);
		});
	});

	// New tests for added methods
	describe('getCastedVote', () => {
		it('should call mock_get_casted_vote', async () => {
			const context = {} as MethodContext;
			const address = Buffer.from('someAddress');
			await governanceMethod.getCastedVote(context, address);
			expect(mock_get_casted_vote).toHaveBeenCalledWith(context, address);
		});
	});

	describe('getBaseVoteScore', () => {
		it('should call mock_get_base_vote_score', async () => {
			const context = {} as MethodContext;
			const address = Buffer.from('someAddress');
			await governanceMethod.getBaseVoteScore(context, address);
			expect(mock_get_base_vote_score).toHaveBeenCalledWith(context, address);
		});
	});

	describe('createProposal', () => {
		it('should call mock_create_proposal', async () => {
			const context = {} as MethodContext;
			const senderAddress = Buffer.from('senderAddress');
			const height = 100;
			const title = 'Proposal Title';
			const summary = 'Proposal Summary';
			const actions = [];
			const attributes = [];

			await governanceMethod.createProposal(context, senderAddress, height, title, summary, actions, attributes);

			expect(mock_create_proposal).toHaveBeenCalledWith(context, senderAddress, height, title, summary, actions, attributes);
		});
	});

	describe('getProposalInstance', () => {
		it('should call mock_get_proposal', async () => {
			const context = {} as MethodContext;
			const senderAddress = Buffer.from('senderAddress');
			const height = 100;
			const proposalId = 1;

			await governanceMethod.getProposalInstance(context, senderAddress, height, proposalId);
			expect(mock_get_proposal).toHaveBeenCalledWith(context, senderAddress, height, proposalId);
		});
	});

	describe('getProposalQueueInstance', () => {
		it('should call mock_get_proposal_queue', async () => {
			const context = {} as MethodContext;
			const senderAddress = Buffer.from('senderAddress');
			const height = 100;

			await governanceMethod.getProposalQueueInstance(context, senderAddress, height);
			expect(mock_get_proposal_queue).toHaveBeenCalledWith(context, senderAddress, height);
		});
	});

	describe('getBoostedAccountInstance', () => {
		it('should call mock_get_boosted_account', async () => {
			const context = {} as MethodContext;
			const address = Buffer.from('address');
			const height = 100;

			await governanceMethod.getBoostedAccountInstance(context, address, height);
			expect(mock_get_boosted_account).toHaveBeenCalledWith(context, address, height);
		});
	});

	describe('getDelegatedVoteInstance', () => {
		it('should call mock_get_delegated_vote', async () => {
			const context = {} as MethodContext;
			const address = Buffer.from('address');
			const height = 100;

			await governanceMethod.getDelegatedVoteInstance(context, address, height);
			expect(mock_get_delegated_vote).toHaveBeenCalledWith(context, address, height);
		});
	});

	describe('getNextAvailableProposalId', () => {
		it('should call mock_get_next_available_proposal_id', async () => {
			const context = {} as MethodContext;
			await governanceMethod.getNextAvailableProposalId(context);
			expect(mock_get_next_available_proposal_id).toHaveBeenCalledWith(context);
		});
	});

	describe('getConfig', () => {
		it('should call mock_get_config', async () => {
			const context = {} as MethodContext;
			await governanceMethod.getConfig(context);
			expect(mock_get_config).toHaveBeenCalledWith(context);
		});
	});
});
