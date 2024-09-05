/* eslint-disable import/no-cycle */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { GenesisConfig, JSONObject, MethodContext, NamedRegistry, codec, utils } from 'klayr-sdk';
import Decimal from 'decimal.js';
import { ConfigActionPayload, CreateProposalParams, ProposalQueueStoreData, ProposalStatus, ProposalStoreData, QuorumMode, SetProposalAttributesParams, VoteParams, Votes } from '../../types';
import { ProposalStore } from '../proposal';
import { BaseInstance } from './base';
import { GovernanceGovernableConfig } from '../../config';
import { bytesToNumber, getBoostMultiplier, numberToBytes, parseBigintOrPercentage, serializer } from '../../utils';
import { ProposalCreatedEvent } from '../../events/proposal_created';
import { NextAvailableProposalIdStore } from '../next_available_proposal_id';
import { MAX_LENGTH_PROPOSAL_SUMMARY, MAX_LENGTH_PROPOSAL_TITLE, POS_MODULE_NAME } from '../../constants';
import { configActionPayloadSchema } from '../../schema';
import { GovernableConfigRegistry } from '../../registry';
import { ProposalVotedEvent } from '../../events/proposal_voted';
import { ProposalSetAttributesEvent } from '../../events/proposal_set_attributes';
import { ProposalQueueStore } from '../queue';
import { DelegatedVoteStore } from '../delegated_vote';
import { VoteChangedEvent } from '../../events/vote_changed';
import { CastedVoteStore } from '../casted_vote';
import { BoostedAccountStore } from '../boosted_account';
import { VoteScoreStore } from '../vote_score';
import { ProposalVoterStore } from '../proposal_voter';
import { decodeConfigProposalValue } from '../../utils/payload';

export class Proposal extends BaseInstance<ProposalStoreData, ProposalStore> implements ProposalStoreData {
	public constructor(
		stores: NamedRegistry,
		events: NamedRegistry,
		config: GovernanceGovernableConfig,
		genesisConfig: GenesisConfig,
		moduleName: string,
		governableConfigRegistry: GovernableConfigRegistry,
		proposal: ProposalStoreData | undefined,
		key: Buffer,
	) {
		super(ProposalStore, stores, events, config, genesisConfig, moduleName, key);

		if (proposal) Object.assign(this, utils.objects.cloneDeep(proposal));

		this.nextAvailableIdStore = stores.get(NextAvailableProposalIdStore);
		this.proposalQueueStore = stores.get(ProposalQueueStore);
		this.delegatedVoteStore = stores.get(DelegatedVoteStore);
		this.castedVoteStore = stores.get(CastedVoteStore);
		this.boostedAccountStore = stores.get(BoostedAccountStore);
		this.voteScoreStore = stores.get(VoteScoreStore);
		this.proposalVoterStore = stores.get(ProposalVoterStore);
		this.governableConfigRegistry = governableConfigRegistry;
	}

	public toJSON() {
		return utils.objects.cloneDeep(
			serializer<ProposalStoreData>({
				title: this.title,
				summary: this.summary,
				deposited: this.deposited,
				author: this.author,
				turnout: this.turnout,
				parameters: this.parameters,
				voteSummary: this.voteSummary,
				status: this.status,
				actions: this.actions,
				attributes: this.attributes,
			}),
		) as JSONObject<ProposalStoreData>;
	}

	public toObject() {
		return utils.objects.cloneDeep({
			title: this.title,
			summary: this.summary,
			deposited: this.deposited,
			author: this.author,
			turnout: this.turnout,
			parameters: this.parameters,
			voteSummary: this.voteSummary,
			status: this.status,
			actions: this.actions,
			attributes: this.attributes,
		} as ProposalStoreData) as ProposalStoreData;
	}

	public async verifyCreate(params: CreateProposalParams) {
		this._checkImmutableDependencies();
		const config = await this.config.getConfig(this.immutableContext!.context);

		if (params.title.length >= MAX_LENGTH_PROPOSAL_TITLE) {
			throw new Error(`params.title should not be more than ${MAX_LENGTH_PROPOSAL_TITLE} characters`);
		}

		if (params.summary.length >= MAX_LENGTH_PROPOSAL_SUMMARY) {
			throw new Error(`params.summary should not be more than ${MAX_LENGTH_PROPOSAL_SUMMARY} characters`);
		}

		if (config.maxProposalActions >= 0 && params.actions.length > config.maxProposalActions) {
			throw new Error(`exceeds max proposal actions of ${config.maxProposalActions}`);
		}

		const senderAvailableBalance = await this.tokenMethod!.getAvailableBalance(this.immutableContext!.context, this.immutableContext!.senderAddress, this._getStakingTokenId());
		const senderLockedBalance = await this.tokenMethod!.getLockedAmount(this.immutableContext!.context, this.immutableContext!.senderAddress, this._getStakingTokenId(), POS_MODULE_NAME);

		const totalSupplyStore = await this.tokenMethod!.getTotalSupply(this.immutableContext!.context as MethodContext);
		const index = totalSupplyStore.totalSupply.findIndex(supply => supply.tokenID.equals(this._getStakingTokenId()));

		const proposalCreationMinBalance = parseBigintOrPercentage(config.proposalCreationMinBalance, totalSupplyStore.totalSupply[index].totalSupply);
		if (senderAvailableBalance + senderLockedBalance < proposalCreationMinBalance) {
			throw new Error(`The sender's balance is below the required min balance of ${proposalCreationMinBalance.toString()} to create a proposal.`);
		}

		if (senderAvailableBalance < BigInt(config.proposalCreationDeposit)) {
			throw new Error(`The sender doesn't have the required balance of ${config.proposalCreationDeposit} for the deposit.`);
		}

		for (const actions of params.actions) {
			if (actions.type === 'config') {
				const payload = codec.decode<ConfigActionPayload>(configActionPayloadSchema, actions.payload);
				const targetConfig = this.governableConfigRegistry.get(payload.moduleName);
				const decodedValue = decodeConfigProposalValue(targetConfig.schema, payload);
				await targetConfig.dryRunSetConfigWithPath(this.immutableContext!.context, payload.paramPath, decodedValue);
			}
		}
	}

	public async create(params: CreateProposalParams, verify = true) {
		this._checkMutableDependencies();

		if (verify) await this.verifyCreate(params);

		const { height } = this.mutableContext!;
		const config = await this.config.getConfig(this.mutableContext!.context);

		this.title = params.title;
		this.summary = params.summary;
		this.deposited = BigInt(config.proposalCreationDeposit);
		this.author = this.mutableContext!.senderAddress;
		this.turnout = {
			for: BigInt(0),
			against: BigInt(0),
			abstain: BigInt(0),
		};
		this.parameters = {
			createdHeight: height,
			startHeight: height + config.votingDelayDuration,
			quorumHeight: height + config.quorumDuration,
			endHeight: height + config.voteDuration,
			executionHeight: height + config.executionDuration,
			maxBoostDuration: config.maxBoostDuration,
			boostFactor: config.boostFactor,
			enableBoosting: config.enableBoosting,
			enableTurnoutBias: config.enableTurnoutBias,
			quorumMode: config.quorumMode,
			quorumTreshold: config.quorumTreshold,
		};
		this.voteSummary = {
			for: BigInt(0),
			against: BigInt(0),
			abstain: BigInt(0),
		};
		this.status = ProposalStatus.CREATED;
		this.actions = params.actions;
		this.attributes = params.attributes;

		await this.tokenMethod!.lock(this.mutableContext!.context, this.mutableContext!.senderAddress, this.moduleName, this._getStakingTokenId(), BigInt(config.proposalCreationDeposit));

		const nextId = await this._getNextAvailableProposalId();
		this.key = numberToBytes(nextId.nextProposalId);
		await this._registerQueue(nextId.nextProposalId);

		await this._saveStore();
		await this._increaseNextAvailableProposalId();

		const events = this.events.get(ProposalCreatedEvent);
		events.add(
			this.mutableContext!.context,
			{
				author: this.mutableContext!.senderAddress,
				proposalId: nextId.nextProposalId,
			},
			[this.mutableContext!.senderAddress],
		);
	}

	public async verifyVote(params: VoteParams) {
		this._checkImmutableDependencies();

		if (!(await this._isProposalExists(params.proposalId))) {
			throw new Error(`proposal with id ${params.proposalId} doesn't exists`);
		}

		if (this.status !== ProposalStatus.ACTIVE) {
			throw new Error(`proposal status is not active`);
		}

		if (![Votes.FOR, Votes.AGAINST, Votes.ABSTAIN].includes(params.decision)) {
			throw new Error('invalid vote decision');
		}

		const senderDelegatedVoteState = await this.delegatedVoteStore.getOrDefault(this.immutableContext!.context, this.immutableContext!.senderAddress);
		if (!senderDelegatedVoteState.outgoingDelegation.equals(Buffer.alloc(0))) {
			throw new Error(`the sender is currently delegating their votes`);
		}
	}

	public async vote(params: VoteParams, verify = true) {
		this._checkMutableDependencies();

		if (verify) await this.verifyVote(params);

		const castedVote = await this.castedVoteStore.getOrDefault(this.mutableContext!.context, this.mutableContext!.senderAddress);
		const proposalIndex = castedVote.activeVote.findIndex(vote => vote.proposalId === params.proposalId);
		const baseScore = await this.voteScoreStore.getVoteScore(this.mutableContext!.context, this.mutableContext!.senderAddress);

		if (proposalIndex !== -1) {
			const boostedState = await this.boostedAccountStore.getOrDefault(this.mutableContext!.context, this.mutableContext!.senderAddress);
			await this.subtractVote(baseScore, castedVote.activeVote[proposalIndex].decision, boostedState.targetHeight);
			await this.addVote(baseScore, params.decision, boostedState.targetHeight);

			const events = this.events.get(VoteChangedEvent);
			events.add(
				this.mutableContext!.context,
				{
					proposalId: params.proposalId,
					voterAddress: this.mutableContext!.senderAddress,
					oldDecision: castedVote.activeVote[proposalIndex].decision,
					newDecision: params.decision,
				},
				[this.mutableContext!.senderAddress],
			);

			await this._removeSenderDelegatedVoteFromProposal();

			castedVote.activeVote[proposalIndex].decision = params.decision;
		} else {
			const boostedState = await this.boostedAccountStore.getOrDefault(this.mutableContext!.context, this.mutableContext!.senderAddress);
			castedVote.activeVote.push({ proposalId: params.proposalId, decision: params.decision });

			await this.addVote(baseScore, params.decision, boostedState.targetHeight);

			const events = this.events.get(ProposalVotedEvent);
			events.add(
				this.mutableContext!.context,
				{
					proposalId: params.proposalId,
					voterAddress: this.mutableContext!.senderAddress,
					decision: params.decision,
				},
				[this.mutableContext!.senderAddress],
			);
		}

		await this.proposalVoterStore.addVoter(this.mutableContext!.context, params.proposalId, this.mutableContext!.senderAddress);
		await this.castedVoteStore.set(this.mutableContext!.context, this.mutableContext!.senderAddress, castedVote);

		await this._addSenderDelegatedVoteFromProposal();
	}

	public async verifySetAttributes(params: SetProposalAttributesParams) {
		this._checkImmutableDependencies();

		if (!(await this._isProposalExists(params.proposalId))) {
			throw new Error(`proposal with id ${params.proposalId} doesn't exists`);
		}

		if (!this._isProposalAuthor()) {
			throw new Error(`sender is not the proposal author`);
		}
	}

	public async setAttributes(params: SetProposalAttributesParams, verify = true) {
		this._checkMutableDependencies();

		if (verify) await this.verifySetAttributes(params);

		const attribute = { key: params.key, data: params.data };

		const index = this.attributes.findIndex(attr => attr.key === params.key);
		if (index > -1) {
			this.attributes[index] = attribute;
		} else {
			this.attributes.push(attribute);
		}

		await this._saveStore();

		const events = this.events.get(ProposalSetAttributesEvent);
		events.add(
			this.mutableContext!.context,
			{
				proposalId: params.proposalId,
				key: params.key,
			},
			[this.author],
		);
	}

	public async getVoteScore(address: Buffer) {
		this._checkImmutableDependencies();

		const castedVote = await this.castedVoteStore.getOrDefault(this.mutableContext!.context, this.mutableContext!.senderAddress);
		const proposalIndex = castedVote.activeVote.findIndex(vote => vote.proposalId === bytesToNumber(this.key));
		if (proposalIndex === -1) return BigInt(0);

		const boostedState = await this.boostedAccountStore.getOrDefault(this.mutableContext!.context, this.mutableContext!.senderAddress);
		const baseScore = await this.voteScoreStore.getVoteScore(this.mutableContext!.context, address);

		return this._calculateVoteScore(baseScore, boostedState.targetHeight);
	}

	public async addVote(score: bigint, decision: Votes, boostingHeight: number) {
		if (this.status !== ProposalStatus.ACTIVE) return;

		const decisionString = this._numberToDecisionString(decision);
		this.voteSummary[decisionString] += this._calculateVoteScore(score, boostingHeight);
		this.turnout[decisionString] += score;
		await this._saveStore();
	}

	public async subtractVote(score: bigint, decision: Votes, boostingHeight: number) {
		if (this.status !== ProposalStatus.ACTIVE) return;

		const decisionString = this._numberToDecisionString(decision);
		this.voteSummary[decisionString] -= this._calculateVoteScore(score, boostingHeight);
		this.turnout[decisionString] -= score;
		await this._saveStore();
	}

	public async setStatus(status: ProposalStatus) {
		this.status = status;
		await this._saveStore();
	}

	private async _removeSenderDelegatedVoteFromProposal() {
		this._checkMutableDependencies();
		if (!this.internalMethod) throw new Error(`proposal instance is created without internalMethod dependencies`);

		const delegatedVote = await this.delegatedVoteStore.getMutableDelegatedVote(this.mutableContext!);

		const incomingDelegationVoteScore = await delegatedVote.getIncomingDelegationVoteScore();
		await this.internalMethod.updateProposalVoteSummaryByVoter(this.mutableContext!.context, this.mutableContext!.senderAddress, BigInt(0), incomingDelegationVoteScore);
	}

	private async _addSenderDelegatedVoteFromProposal() {
		this._checkMutableDependencies();
		if (!this.internalMethod) throw new Error(`proposal instance is created without internalMethod dependencies`);

		const delegatedVote = await this.delegatedVoteStore.getMutableDelegatedVote(this.mutableContext!);

		const incomingDelegationVoteScore = await delegatedVote.getIncomingDelegationVoteScore();
		await this.internalMethod.updateProposalVoteSummaryByVoter(this.mutableContext!.context, this.mutableContext!.senderAddress, incomingDelegationVoteScore, BigInt(0));
	}

	private _calculateVoteScore(score: bigint, boostingHeight: number) {
		if (this.parameters.enableBoosting) {
			const boostMultiplier = getBoostMultiplier(this.parameters.endHeight, boostingHeight, this.parameters.maxBoostDuration, this.parameters.boostFactor);
			return BigInt(new Decimal(score.toString()).mul(boostMultiplier).toFixed(0));
		}

		return score;
	}

	private _numberToDecisionString(decision: number): 'for' | 'against' | 'abstain' {
		if (decision === Votes.FOR) return 'for';
		if (decision === Votes.AGAINST) return 'against';
		if (decision === Votes.ABSTAIN) return 'abstain';
		throw new Error(`unknown decision value: ${decision}`);
	}

	private async _registerQueue(proposalId: number) {
		this._checkMutableDependencies();

		const { height } = this.mutableContext!;
		const config = await this.config.getConfig(this.mutableContext!.context);

		await this._saveQueue(proposalId, height + config.votingDelayDuration, 'start');
		await this._saveQueue(proposalId, height + config.voteDuration, 'ends');
		await this._saveQueue(proposalId, height + config.quorumDuration, 'quorum');
		await this._saveQueue(proposalId, height + config.executionDuration, 'execute');
	}

	private async _saveQueue(proposalId: number, height: number, type: keyof ProposalQueueStoreData) {
		const proposalQueue = await this.proposalQueueStore.getOrDefault(this.mutableContext!.context, numberToBytes(height));
		if (proposalQueue[type].findIndex(id => id === proposalId) === -1) proposalQueue[type].push(proposalId);
		await this.proposalQueueStore.set(this.mutableContext!.context, numberToBytes(height), proposalQueue);
	}

	private async _getNextAvailableProposalId() {
		this._checkDependencies();
		return this.nextAvailableIdStore.getOrDefault(this.mutableContext!.context);
	}

	private async _increaseNextAvailableProposalId() {
		this._checkDependencies();
		await this.nextAvailableIdStore.increase(this.mutableContext!.context);
	}

	private _getStakingTokenId() {
		return Buffer.concat([Buffer.from(this.genesisConfig.chainID, 'hex'), Buffer.from('00000000', 'hex')]);
	}

	private async _isProposalExists(proposalId: number) {
		return this.instanceStore.has(this.immutableContext!.context, this.instanceStore.getKey(proposalId));
	}

	private _isProposalAuthor() {
		if (Buffer.compare(this.immutableContext!.senderAddress, this.author) !== 0) {
			return false;
		}
		return true;
	}

	public title: ProposalStoreData['title'] = '';
	public summary: ProposalStoreData['summary'] = '';
	public deposited: ProposalStoreData['deposited'] = BigInt(0);
	public author: ProposalStoreData['author'] = Buffer.alloc(0);
	public turnout: ProposalStoreData['turnout'] = { for: BigInt(0), against: BigInt(0), abstain: BigInt(0) };
	public parameters: ProposalStoreData['parameters'] = {
		createdHeight: 0,
		startHeight: 0,
		quorumHeight: 0,
		endHeight: 0,
		executionHeight: 0,
		maxBoostDuration: 0,
		boostFactor: 1,
		enableBoosting: false,
		enableTurnoutBias: false,
		quorumMode: QuorumMode.FOR_AGAINST_ABSTAIN,
		quorumTreshold: '0',
	};
	public voteSummary: ProposalStoreData['voteSummary'] = { for: BigInt(0), against: BigInt(0), abstain: BigInt(0) };
	public status: ProposalStoreData['status'] = 0;
	public actions: ProposalStoreData['actions'] = [];
	public attributes: ProposalStoreData['attributes'] = [];

	private readonly nextAvailableIdStore: NextAvailableProposalIdStore;
	private readonly governableConfigRegistry: GovernableConfigRegistry;
	private readonly proposalQueueStore: ProposalQueueStore;
	private readonly delegatedVoteStore: DelegatedVoteStore;
	private readonly castedVoteStore: CastedVoteStore;
	private readonly boostedAccountStore: BoostedAccountStore;
	private readonly voteScoreStore: VoteScoreStore;
	private readonly proposalVoterStore: ProposalVoterStore;
}
