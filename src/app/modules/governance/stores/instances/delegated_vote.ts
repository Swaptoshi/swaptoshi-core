/* eslint-disable import/no-cycle */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { GenesisConfig, JSONObject, NamedRegistry, cryptography, utils } from 'klayr-sdk';
import { DelegateVoteParams, DelegatedVoteStoreData, RevokeDelegatedVoteParams } from '../../types';
import { BaseInstance } from './base';
import { GovernanceGovernableConfig } from '../../config';
import { serializer, verifyAddress } from '../../utils';
import { DelegatedVoteStore } from '../delegated_vote';
import { VoteDelegatedEvent } from '../../events/vote_delegated';
import { DelegatedVoteRevokedEvent } from '../../events/delegated_vote_revoked';
import { VoteScoreStore } from '../vote_score';
import { CastedVoteStore } from '../casted_vote';

export class DelegatedVote extends BaseInstance<DelegatedVoteStoreData, DelegatedVoteStore> implements DelegatedVoteStoreData {
	public constructor(
		stores: NamedRegistry,
		events: NamedRegistry,
		config: GovernanceGovernableConfig,
		genesisConfig: GenesisConfig,
		moduleName: string,
		delegatedVote: DelegatedVoteStoreData,
		address: Buffer,
	) {
		super(DelegatedVoteStore, stores, events, config, genesisConfig, moduleName, address);

		Object.assign(this, utils.objects.cloneDeep(delegatedVote));

		this.castedVoteStore = stores.get(CastedVoteStore);
		this.voteScoreStore = stores.get(VoteScoreStore);
	}

	public toJSON() {
		return utils.objects.cloneDeep(
			serializer<DelegatedVoteStoreData>({
				outgoingDelegation: this.outgoingDelegation,
				incomingDelegation: this.incomingDelegation,
			}),
		) as JSONObject<DelegatedVoteStoreData>;
	}

	public toObject() {
		return utils.objects.cloneDeep({
			outgoingDelegation: this.outgoingDelegation,
			incomingDelegation: this.incomingDelegation,
		} as DelegatedVoteStoreData) as DelegatedVoteStoreData;
	}

	// eslint-disable-next-line @typescript-eslint/require-await
	public async verifyDelegateVote(params: DelegateVoteParams) {
		this._checkImmutableDependencies();
		verifyAddress('params.delegateeAddress', params.delegateeAddress);

		if (Buffer.compare(this.outgoingDelegation, Buffer.alloc(0)) !== 0) {
			throw new Error(`sender already delegate their vote, revoke it first!`);
		}

		const delegateeAccount = await this.instanceStore.getOrDefault(this.immutableContext!.context, params.delegateeAddress);
		const index = delegateeAccount.incomingDelegation.findIndex(buf => buf.equals(this.immutableContext!.senderAddress));
		if (index !== -1) {
			throw new Error(`sender already exists on ${cryptography.address.getKlayr32AddressFromAddress(params.delegateeAddress)} incoming delegation`);
		}

		const senderAccount = await this.instanceStore.getOrDefault(this.immutableContext!.context, this.immutableContext!.senderAddress);
		const senderIndex = senderAccount.incomingDelegation.findIndex(buf => buf.equals(params.delegateeAddress));
		if (senderIndex !== -1) {
			throw new Error(
				`circular delegation detected: ${cryptography.address.getKlayr32AddressFromAddress(params.delegateeAddress)} => ${cryptography.address.getKlayr32AddressFromAddress(
					this.immutableContext!.senderAddress,
				)} => ${cryptography.address.getKlayr32AddressFromAddress(params.delegateeAddress)}`,
			);
		}
	}

	public async delegateVote(params: DelegateVoteParams, verify = true) {
		this._checkMutableDependencies();

		if (verify) await this.verifyDelegateVote(params);

		await this._removeSenderVoteAndDelegatedVoteFromProposal();

		this.outgoingDelegation = params.delegateeAddress;

		await this._saveStore();

		const delegateeAccount = await this.instanceStore.getOrDefault(this.mutableContext!.context, params.delegateeAddress);
		delegateeAccount.incomingDelegation.push(this.mutableContext!.senderAddress);
		await this.instanceStore.set(this.mutableContext!.context, params.delegateeAddress, delegateeAccount);

		await this._addDelegatedSenderVoteToProposal();

		const events = this.events.get(VoteDelegatedEvent);
		events.add(
			this.mutableContext!.context,
			{
				delegatorAddress: this.mutableContext!.senderAddress,
				delegateeAddress: params.delegateeAddress,
			},
			[this.mutableContext!.senderAddress, params.delegateeAddress],
		);
	}

	// eslint-disable-next-line @typescript-eslint/require-await
	public async verifyRevokeDelegatedVote(_params: RevokeDelegatedVoteParams | undefined) {
		this._checkImmutableDependencies();

		if (Buffer.compare(this.outgoingDelegation, Buffer.alloc(0)) === 0) {
			throw new Error(`sender is not delegating their vote!`);
		}
	}

	public async revokeDelegatedVote(_params: RevokeDelegatedVoteParams | undefined, verify = true) {
		this._checkMutableDependencies();

		if (verify) await this.verifyRevokeDelegatedVote(_params);

		await this._removeSenderVoteAndDelegatedVoteFromProposal();

		const delegateeAccount = await this.instanceStore.getOrDefault(this.mutableContext!.context, this.outgoingDelegation);

		const indexToRemove = delegateeAccount.incomingDelegation.findIndex(buf => buf.equals(this.mutableContext!.senderAddress));
		if (indexToRemove !== -1) delegateeAccount.incomingDelegation.splice(indexToRemove, 1);
		await this.instanceStore.set(this.mutableContext!.context, this.outgoingDelegation, delegateeAccount);

		const events = this.events.get(DelegatedVoteRevokedEvent);
		events.add(
			this.mutableContext!.context,
			{
				delegatorAddress: this.mutableContext!.senderAddress,
				delegateeAddress: this.outgoingDelegation,
			},
			[this.mutableContext!.senderAddress, this.outgoingDelegation],
		);

		this.outgoingDelegation = Buffer.alloc(0);
		await this._saveStore();
	}

	public async getIncomingDelegationVoteScore() {
		return this._getIncomingDelegationVoteScore(this.key);
	}

	private async _getIncomingDelegationVoteScore(address: Buffer): Promise<bigint> {
		this._checkImmutableDependencies();

		let totalVoteScore = BigInt(0);

		const delegatedVote = await this.instanceStore.getOrDefault(this.immutableContext!.context, address);

		for (const incomingDelegation of delegatedVote.incomingDelegation) {
			const voteScore = await this.voteScoreStore.getVoteScore(this.immutableContext!.context, incomingDelegation);
			totalVoteScore += voteScore;

			const incomingDelegationState = await this.instanceStore.getOrDefault(this.immutableContext!.context, incomingDelegation);
			if (incomingDelegationState.incomingDelegation.length > 0) {
				totalVoteScore += await this._getIncomingDelegationVoteScore(incomingDelegation);
			}
		}

		return totalVoteScore;
	}

	private async _removeSenderVoteAndDelegatedVoteFromProposal() {
		this._checkMutableDependencies();
		if (!this.internalMethod) throw new Error(`delegatedVote instance is created without internalMethod dependencies`);

		const voteScore = await this.voteScoreStore.getVoteScore(this.mutableContext!.context, this.mutableContext!.senderAddress);
		const incomingDelegationVoteScore = await this._getIncomingDelegationVoteScore(this.mutableContext!.senderAddress);

		await this.internalMethod.updateProposalVoteSummaryByVoter(this.mutableContext!.context, this.mutableContext!.senderAddress, BigInt(0), voteScore + incomingDelegationVoteScore);

		await this.castedVoteStore.removeAllCastedVote(this.mutableContext!.context, this.mutableContext!.senderAddress);
	}

	private async _addDelegatedSenderVoteToProposal() {
		this._checkMutableDependencies();
		if (!this.internalMethod) throw new Error(`delegatedVote instance is created without internalMethod dependencies`);

		const voteScore = await this.voteScoreStore.getVoteScore(this.mutableContext!.context, this.mutableContext!.senderAddress);
		const incomingDelegationVoteScore = await this._getIncomingDelegationVoteScore(this.mutableContext!.senderAddress);

		await this.internalMethod.updateProposalVoteSummaryByVoter(this.mutableContext!.context, this.mutableContext!.senderAddress, voteScore + incomingDelegationVoteScore, BigInt(0));
	}

	public outgoingDelegation: DelegatedVoteStoreData['outgoingDelegation'] = Buffer.alloc(0);
	public incomingDelegation: DelegatedVoteStoreData['incomingDelegation'] = [];

	private readonly castedVoteStore: CastedVoteStore;
	private readonly voteScoreStore: VoteScoreStore;
}
