/* eslint-disable */
import { Modules, StateMachine } from 'klayr-sdk';
import { GovernableConfigRegistry } from './registry';
import { BaseGovernableConfig } from './base_governable_config';
import { GovernanceGovernableConfig } from './config';
import { ProposalStore } from './stores/proposal';
import { methodGovernanceContext } from './stores/context';
import { NextAvailableProposalIdStoreData, ProposalStoreData, StoreInstance } from './types';
import { BoostedAccount, DelegatedVote, Proposal, ProposalQueue } from './stores/instances';
import { ProposalQueueStore } from './stores/queue';
import { BoostedAccountStore } from './stores/boosted_account';
import { DelegatedVoteStore } from './stores/delegated_vote';
import { NextAvailableProposalIdStore } from './stores/next_available_proposal_id';
import { CastedVoteStore } from './stores/casted_vote';
import { VoteScoreStore } from './stores/vote_score';

export class GovernanceMethod extends Modules.BaseMethod {
	private _governableConfig: GovernableConfigRegistry | undefined;

	public init(governableConfig: GovernableConfigRegistry) {
		this._governableConfig = governableConfig;
	}

	public registerGovernableConfig(args: Modules.ModuleInitArgs, moduleName: string, governableConfig: BaseGovernableConfig<any>): void {
		if (!this._governableConfig) throw new Error('GovernanceMethod is not initialized');
		governableConfig.register(this.events, this, args);
		this._governableConfig.register(moduleName, governableConfig);
	}

	public unregisterGovernableConfig(moduleName: string, governableConfig: BaseGovernableConfig<any>): void {
		if (!this._governableConfig) throw new Error('GovernanceMethod is not initialized');
		governableConfig.unregister();
		this._governableConfig.unregister(moduleName);
	}

	public getGovernableConfig<T extends object>(module: string): BaseGovernableConfig<T> {
		if (!this._governableConfig) throw new Error('GovernanceMethod is not initialized');
		return this._governableConfig.get(module) as BaseGovernableConfig<T>;
	}

	public async getConfig(context: StateMachine.MethodContext) {
		const configStore = this.stores.get(GovernanceGovernableConfig);
		const config = await configStore.getConfig(context);
		return config;
	}

	public async getCastedVote(context: StateMachine.MethodContext, address: Buffer) {
		const castedVoteStore = this.stores.get(CastedVoteStore);
		const castedVote = await castedVoteStore.getOrDefault(context, address);
		return castedVote;
	}

	public async getBaseVoteScore(context: StateMachine.MethodContext, address: Buffer) {
		const baseVoteStore = this.stores.get(VoteScoreStore);
		const baseVote = await baseVoteStore.getVoteScore(context, address);
		return baseVote;
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
		const proposalStore = this.stores.get(ProposalStore);
		const _context = methodGovernanceContext(context, senderAddress, height);
		await proposalStore.createProposal(_context, { title, summary, actions, attributes });
	}

	public async getProposalInstance(context: StateMachine.MethodContext, senderAddress: Buffer, height: number, proposalId: number): Promise<StoreInstance<Proposal>> {
		const proposalStore = this.stores.get(ProposalStore);
		const _context = methodGovernanceContext(context, senderAddress, height);
		return proposalStore.getMutableProposal(_context, proposalId);
	}

	public async getProposalQueueInstance(context: StateMachine.MethodContext, senderAddress: Buffer, height: number): Promise<StoreInstance<ProposalQueue>> {
		const proposalQueueStore = this.stores.get(ProposalQueueStore);
		const _context = methodGovernanceContext(context, senderAddress, height);
		return proposalQueueStore.getInstance(_context);
	}

	public async getBoostedAccountInstance(context: StateMachine.MethodContext, address: Buffer, height: number): Promise<StoreInstance<BoostedAccount>> {
		const boostedAccountStore = this.stores.get(BoostedAccountStore);
		const _context = methodGovernanceContext(context, address, height);
		return boostedAccountStore.getMutableBoostedAccount(_context);
	}

	public async getDelegatedVoteInstance(context: StateMachine.MethodContext, address: Buffer, height: number): Promise<StoreInstance<DelegatedVote>> {
		const delegatedVoteStore = this.stores.get(DelegatedVoteStore);
		const _context = methodGovernanceContext(context, address, height);
		return delegatedVoteStore.getMutableDelegatedVote(_context);
	}

	public async getNextAvailableProposalId(context: StateMachine.MethodContext): Promise<NextAvailableProposalIdStoreData> {
		const nextAvailableIdStore = this.stores.get(NextAvailableProposalIdStore);
		return nextAvailableIdStore.getOrDefault(context);
	}
}
