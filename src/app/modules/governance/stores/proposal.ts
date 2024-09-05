/* eslint-disable import/no-cycle */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { proposalStoreSchema } from '../schema';
import { CreateProposalParams, ImmutableGovernanceContext, MutableGovernanceContext, ProposalStatus, ProposalStoreData, QuorumMode, StoreInstance } from '../types';
import { numberToBytes } from '../utils';
import { BaseStoreWithInstance } from './base';
import { Proposal } from './instances';

export class ProposalStore extends BaseStoreWithInstance<ProposalStoreData> {
	public async verifyCreateProposal(ctx: ImmutableGovernanceContext, params: CreateProposalParams) {
		this._checkDependencies();

		const proposal = new Proposal(this.stores, this.events, this.config!, this.genesisConfig!, this.moduleName, this.governableConfigRegistry!, undefined, Buffer.alloc(0));

		proposal.addImmutableDependencies({
			context: ctx,
			tokenMethod: this.tokenMethod!,
			internalMethod: this.internalMethod,
		});

		await proposal.verifyCreate(params);
	}

	public async createProposal(ctx: MutableGovernanceContext, params: CreateProposalParams, verify = true) {
		this._checkDependencies();

		const proposal = new Proposal(this.stores, this.events, this.config!, this.genesisConfig!, this.moduleName, this.governableConfigRegistry!, undefined, Buffer.alloc(0));

		proposal.addMutableDependencies({
			context: ctx,
			tokenMethod: this.tokenMethod!,
			internalMethod: this.internalMethod,
		});

		await proposal.create(params, verify);
	}

	public async getMutableProposal(ctx: MutableGovernanceContext, proposalId: number): Promise<StoreInstance<Proposal>> {
		this._checkDependencies();

		const key = this.getKey(proposalId);
		const proposalData = await this.get(ctx.context, key);

		const proposal = new Proposal(this.stores, this.events, this.config!, this.genesisConfig!, this.moduleName, this.governableConfigRegistry!, proposalData, key);

		proposal.addMutableDependencies({
			context: ctx,
			tokenMethod: this.tokenMethod!,
			internalMethod: this.internalMethod,
		});

		return proposal;
	}

	public async getImmutableProposal(ctx: ImmutableGovernanceContext, proposalId: number): Promise<StoreInstance<Proposal>> {
		this._checkDependencies();

		const key = this.getKey(proposalId);
		const proposalData = await this.get(ctx.context, key);

		const proposal = new Proposal(this.stores, this.events, this.config!, this.genesisConfig!, this.moduleName, this.governableConfigRegistry!, proposalData, key);

		proposal.addImmutableDependencies({
			context: ctx,
			tokenMethod: this.tokenMethod!,
			internalMethod: this.internalMethod,
		});

		return proposal;
	}

	public getKey(proposalId: number) {
		return numberToBytes(proposalId);
	}

	public schema = proposalStoreSchema;
	protected readonly default = {
		title: '',
		summary: '',
		deposited: BigInt(0),
		author: Buffer.alloc(0),
		turnout: { for: BigInt(0), against: BigInt(0), abstain: BigInt(0) },
		parameters: {
			createdHeight: 0,
			startHeight: 0,
			quorumHeight: 0,
			endHeight: 0,
			executionHeight: 0,
			boostFactor: 1,
			maxBoostDuration: 0,
			enableBoosting: false,
			enableTurnoutBias: false,
			quorumMode: QuorumMode.FOR_AGAINST_ABSTAIN,
			quorumTreshold: '0',
		},
		voteSummary: { for: BigInt(0), against: BigInt(0), abstain: BigInt(0) },
		status: ProposalStatus.EXECUTED_WITH_ERROR,
		actions: [],
		attributes: [],
	};
}
