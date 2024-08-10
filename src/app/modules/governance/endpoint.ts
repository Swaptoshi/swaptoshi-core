/* eslint-disable */
import { BaseEndpoint, cryptography, ModuleEndpointContext, validator } from 'klayr-sdk';
import { GovernableConfigRegistry } from './registry';
import { GovernanceGovernableConfig } from './config';
import { numberToBytes, serializer } from './utils';
import { GetBaseVoteScoreParams, GetBoostedAccountParams, GetCastedVoteParams, GetDelegatedVoteParams, GetProposalParams, GetProposalQueueParams } from './types';
import {
	getBaseVoteScoreEndpointRequestSchema,
	getBoostedAccountEndpointRequestSchema,
	getCastedVoteEndpointRequestSchema,
	getDelegatedVoteEndpointRequestSchema,
	getProposalEndpointRequestSchema,
	getProposalQueueEndpointRequestSchema,
} from './schema';
import { CastedVoteStore } from './stores/casted_vote';
import { VoteScoreStore } from './stores/vote_score';
import { ProposalStore } from './stores/proposal';
import { ProposalQueueStore } from './stores/queue';
import { BoostedAccountStore } from './stores/boosted_account';
import { DelegatedVoteStore } from './stores/delegated_vote';
import { NextAvailableProposalIdStore } from './stores/next_available_proposal_id';

export class GovernanceEndpoint extends BaseEndpoint {
	private _governableConfig: GovernableConfigRegistry | undefined;

	public init(governableConfig: GovernableConfigRegistry) {
		this._governableConfig = governableConfig;
	}

	public async getConfig(_context: ModuleEndpointContext) {
		const configStore = this.stores.get(GovernanceGovernableConfig);
		const config = await configStore.getConfig(_context);
		return serializer(config);
	}

	public async getRegisteredGovernableConfig(_context: ModuleEndpointContext) {
		if (!this._governableConfig) throw new Error('GovernanceEndpoint is not initialized');
		const response = {
			modules: [...this._governableConfig!.keys()],
		};
		return serializer(response);
	}

	public async getCastedVote(context: ModuleEndpointContext) {
		const params = context.params as unknown as GetCastedVoteParams;
		validator.validator.validate(getCastedVoteEndpointRequestSchema, params);
		const store = this.stores.get(CastedVoteStore);
		const data = await store.getOrDefault(context, cryptography.address.getAddressFromKlayr32Address(params.address));
		return serializer(data);
	}

	public async getBaseVoteScore(context: ModuleEndpointContext) {
		const params = context.params as unknown as GetBaseVoteScoreParams;
		validator.validator.validate(getBaseVoteScoreEndpointRequestSchema, params);
		const store = this.stores.get(VoteScoreStore);
		const data = await store.getVoteScore(context, cryptography.address.getAddressFromKlayr32Address(params.address));
		return serializer({ score: data });
	}

	public async getProposal(context: ModuleEndpointContext) {
		const params = context.params as unknown as GetProposalParams;
		validator.validator.validate(getProposalEndpointRequestSchema, params);
		const store = this.stores.get(ProposalStore);
		const data = await store.getOrDefault(context, numberToBytes(params.proposalId));
		return serializer(data);
	}

	public async getProposalQueue(context: ModuleEndpointContext) {
		const params = context.params as unknown as GetProposalQueueParams;
		validator.validator.validate(getProposalQueueEndpointRequestSchema, params);
		const store = this.stores.get(ProposalQueueStore);
		const data = await store.getOrDefault(context, numberToBytes(params.height));
		return serializer(data);
	}

	public async getBoostedAccount(context: ModuleEndpointContext) {
		const params = context.params as unknown as GetBoostedAccountParams;
		validator.validator.validate(getBoostedAccountEndpointRequestSchema, params);
		const store = this.stores.get(BoostedAccountStore);
		const data = await store.getOrDefault(context, cryptography.address.getAddressFromKlayr32Address(params.address));
		return serializer(data);
	}

	public async getDelegatedVote(context: ModuleEndpointContext) {
		const params = context.params as unknown as GetDelegatedVoteParams;
		validator.validator.validate(getDelegatedVoteEndpointRequestSchema, params);
		const store = this.stores.get(DelegatedVoteStore);
		const data = await store.getOrDefault(context, cryptography.address.getAddressFromKlayr32Address(params.address));
		return serializer(data);
	}

	public async getNextAvailableProposalId(context: ModuleEndpointContext) {
		const store = this.stores.get(NextAvailableProposalIdStore);
		const data = await store.getOrDefault(context);
		return serializer(data);
	}
}
