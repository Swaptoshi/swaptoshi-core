/* eslint-disable */
import { BaseMethod, MethodContext, ModuleInitArgs } from 'klayr-sdk';
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

	public unregisterGovernableConfig(moduleName: string, governableConfig: BaseGovernableConfig<any>): void {
		if (!this._governableConfig) throw new Error('GovernanceMethod is not initialized');
		governableConfig.unregister();
		this._governableConfig.unregister(moduleName);
	}

	public getGovernableConfig<T extends object>(module: string): BaseGovernableConfig<T> {
		if (!this._governableConfig) throw new Error('GovernanceMethod is not initialized');
		return this._governableConfig.get(module) as BaseGovernableConfig<T>;
	}

	public async getConfig(context: MethodContext) {
		const configStore = this.stores.get(GovernanceGovernableConfig);
		const config = await configStore.getConfig(context);
		return config;
	}

	public async getCastedVote(context: MethodContext, address: Buffer) {
		const castedVoteStore = this.stores.get(CastedVoteStore);
		const castedVote = await castedVoteStore.getOrDefault(context, address);
		return castedVote;
	}

	public async getBaseVoteScore(context: MethodContext, address: Buffer) {
		const baseVoteStore = this.stores.get(VoteScoreStore);
		const baseVote = await baseVoteStore.getVoteScore(context, address);
		return baseVote;
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
		const proposalStore = this.stores.get(ProposalStore);
		const _context = methodGovernanceContext(context, senderAddress, timestamp, height);
		await proposalStore.createProposal(_context, { title, summary, actions, attributes });
	}

	public async getProposal(context: MethodContext, senderAddress: Buffer, timestamp: number, height: number, proposalId: number): Promise<StoreInstance<Proposal>> {
		const proposalStore = this.stores.get(ProposalStore);
		const _context = methodGovernanceContext(context, senderAddress, timestamp, height);
		return proposalStore.getMutableProposal(_context, proposalId);
	}

	public async getProposalQueue(context: MethodContext, senderAddress: Buffer, timestamp: number, height: number): Promise<StoreInstance<ProposalQueue>> {
		const proposalQueueStore = this.stores.get(ProposalQueueStore);
		const _context = methodGovernanceContext(context, senderAddress, timestamp, height);
		return proposalQueueStore.getInstance(_context);
	}

	public async getBoostedAccount(context: MethodContext, address: Buffer, timestamp: number, height: number): Promise<StoreInstance<BoostedAccount>> {
		const boostedAccountStore = this.stores.get(BoostedAccountStore);
		const _context = methodGovernanceContext(context, address, timestamp, height);
		return boostedAccountStore.getMutableBoostedAccount(_context);
	}

	public async getDelegatedVote(context: MethodContext, address: Buffer, timestamp: number, height: number): Promise<StoreInstance<DelegatedVote>> {
		const delegatedVoteStore = this.stores.get(DelegatedVoteStore);
		const _context = methodGovernanceContext(context, address, timestamp, height);
		return delegatedVoteStore.getMutableDelegatedVote(_context);
	}

	public async getNextAvailableProposalId(context: MethodContext): Promise<NextAvailableProposalIdStoreData> {
		const nextAvailableIdStore = this.stores.get(NextAvailableProposalIdStore);
		return nextAvailableIdStore.getOrDefault(context);
	}
}
