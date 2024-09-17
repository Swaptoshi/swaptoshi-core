/* eslint-disable @typescript-eslint/member-ordering */
/* eslint-disable camelcase */
/* eslint-disable @typescript-eslint/require-await */
import { Modules, StateMachine } from 'klayr-sdk';
import { GovernableConfigRegistry } from '../../../../../../../src/app/modules/governance/registry';
import { BaseGovernableConfig, GovernanceMethod, ProposalStoreData } from '../../../../../../../src/app/modules/governance';

// Existing mocks
export const mock_governance_init = jest.fn();
export const mock_register_governable_config = jest.fn();
export const mock_unregister_governable_config = jest.fn();
export const mock_get_governable_config = jest.fn();
export const mock_get_governance_config = jest.fn();

// New mocks
export const mock_get_casted_vote = jest.fn();
export const mock_get_base_vote_score = jest.fn();
export const mock_create_proposal = jest.fn();
export const mock_get_proposal = jest.fn();
export const mock_get_proposal_queue = jest.fn();
export const mock_get_boosted_account = jest.fn();
export const mock_get_delegated_vote = jest.fn();
export const mock_get_next_available_proposal_id = jest.fn();
export const mock_get_config = jest.fn();

export class MockedGovernanceMethod implements Omit<GovernanceMethod, '_governableConfig'> {
	stores = new Modules.NamedRegistry();
	events = new Modules.NamedRegistry();

	public init(governableConfig: GovernableConfigRegistry): void {
		mock_governance_init(governableConfig);
	}

	public registerGovernableConfig(args: Modules.ModuleInitArgs, moduleName: string, governableConfig: BaseGovernableConfig<any>): void {
		governableConfig.init(args);
		mock_register_governable_config(args, moduleName, governableConfig);
	}

	public unregisterGovernableConfig(moduleName: string, governableConfig: BaseGovernableConfig<any>): void {
		mock_unregister_governable_config(moduleName, governableConfig);
	}

	public getGovernableConfig<T extends object>(module: string): BaseGovernableConfig<T> {
		return mock_get_governable_config(module) as BaseGovernableConfig<T>;
	}

	public async getGovernanceConfig(context: StateMachine.MethodContext) {
		return mock_get_governance_config(context);
	}

	// New methods
	public async getCastedVote(context: StateMachine.MethodContext, address: Buffer) {
		return mock_get_casted_vote(context, address);
	}

	public async getBaseVoteScore(context: StateMachine.MethodContext, address: Buffer) {
		return mock_get_base_vote_score(context, address);
	}

	public async createProposal(
		context: StateMachine.MethodContext,
		senderAddress: Buffer,
		height: number,
		title: string,
		summary: string,
		actions: ProposalStoreData['actions'],
		attributes: ProposalStoreData['attributes'],
	) {
		return mock_create_proposal(context, senderAddress, height, title, summary, actions, attributes);
	}

	public async getProposalInstance(context: StateMachine.MethodContext, senderAddress: Buffer, height: number, proposalId: number) {
		return mock_get_proposal(context, senderAddress, height, proposalId);
	}

	public async getProposalQueueInstance(context: StateMachine.MethodContext, senderAddress: Buffer, height: number) {
		return mock_get_proposal_queue(context, senderAddress, height);
	}

	public async getBoostedAccountInstance(context: StateMachine.MethodContext, address: Buffer, height: number) {
		return mock_get_boosted_account(context, address, height);
	}

	public async getDelegatedVoteInstance(context: StateMachine.MethodContext, address: Buffer, height: number) {
		return mock_get_delegated_vote(context, address, height);
	}

	public async getNextAvailableProposalId(context: StateMachine.MethodContext) {
		return mock_get_next_available_proposal_id(context);
	}

	public async getConfig(context: StateMachine.MethodContext) {
		return mock_get_config(context);
	}
}
