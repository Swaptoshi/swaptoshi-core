/* eslint-disable @typescript-eslint/member-ordering */
/* eslint-disable camelcase */
/* eslint-disable @typescript-eslint/require-await */
import { MethodContext, ModuleInitArgs, NamedRegistry } from 'klayr-sdk';
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
	stores = new NamedRegistry();
	events = new NamedRegistry();

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

	// New methods
	public async getCastedVote(context: MethodContext, address: Buffer) {
		return mock_get_casted_vote(context, address);
	}

	public async getBaseVoteScore(context: MethodContext, address: Buffer) {
		return mock_get_base_vote_score(context, address);
	}

	public async createProposal(
		context: MethodContext,
		senderAddress: Buffer,
		timestamp: number,
		height: number,
		title: string,
		summary: string,
		actions: ProposalStoreData['actions'],
		attributes: ProposalStoreData['attributes'],
	) {
		return mock_create_proposal(context, senderAddress, timestamp, height, title, summary, actions, attributes);
	}

	public async getProposalInstance(context: MethodContext, senderAddress: Buffer, timestamp: number, height: number, proposalId: number) {
		return mock_get_proposal(context, senderAddress, timestamp, height, proposalId);
	}

	public async getProposalQueueInstance(context: MethodContext, senderAddress: Buffer, timestamp: number, height: number) {
		return mock_get_proposal_queue(context, senderAddress, timestamp, height);
	}

	public async getBoostedAccountInstance(context: MethodContext, address: Buffer, timestamp: number, height: number) {
		return mock_get_boosted_account(context, address, timestamp, height);
	}

	public async getDelegatedVoteInstance(context: MethodContext, address: Buffer, timestamp: number, height: number) {
		return mock_get_delegated_vote(context, address, timestamp, height);
	}

	public async getNextAvailableProposalId(context: MethodContext) {
		return mock_get_next_available_proposal_id(context);
	}

	public async getConfig(context: MethodContext) {
		return mock_get_config(context);
	}
}
