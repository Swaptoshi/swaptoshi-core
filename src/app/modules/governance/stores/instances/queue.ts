/* eslint-disable import/no-cycle */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { codec, cryptography, Modules, Types, utils } from 'klayr-sdk';
import { ConfigActionPayload, FundingActionPayload, ProposalQueueStoreData, ProposalStatus, QuorumMode } from '../../types';
import { ProposalQueueStore } from '../queue';
import { BaseInstance } from './base';
import { GovernanceGovernableConfig } from '../../config';
import { isSatisfyTurnoutBias, numberToBytes, parseBigintOrPercentage, serializer } from '../../utils';
import { ProposalStore } from '../proposal';
import { GovernableConfigRegistry } from '../../registry';
import { ProposalActiveEvent } from '../../events/proposal_active';
import { ProposalQuorumCheckedEvent } from '../../events/proposal_quorum_checked';
import { ProposalOutcomeEvent } from '../../events/proposal_outcome';
import { configActionPayloadSchema, fundingActionPayloadSchema } from '../../schema';
import { ProposalExecutedEvent } from '../../events/proposal_executed';
import { ProposalVoterStore } from '../proposal_voter';
import { CastedVoteStore } from '../casted_vote';
import { decodeConfigProposalValue } from '../../utils/payload';

export class ProposalQueue extends BaseInstance<ProposalQueueStoreData, ProposalQueueStore> implements ProposalQueueStoreData {
	public constructor(
		stores: Modules.NamedRegistry,
		events: Modules.NamedRegistry,
		config: GovernanceGovernableConfig,
		genesisConfig: Types.GenesisConfig,
		moduleName: string,
		governableConfigRegistry: GovernableConfigRegistry,
		queue: ProposalQueueStoreData,
		height: number,
	) {
		super(ProposalQueueStore, stores, events, config, genesisConfig, moduleName, numberToBytes(height));

		Object.assign(this, utils.objects.cloneDeep(queue));

		this.proposalStore = this.stores.get(ProposalStore);
		this.proposalVoterStore = this.stores.get(ProposalVoterStore);
		this.castedVoteStore = this.stores.get(CastedVoteStore);

		this.governableConfigRegistry = governableConfigRegistry;
	}

	public toJSON() {
		return utils.objects.cloneDeep(
			serializer<ProposalQueueStoreData>({
				start: this.start,
				quorum: this.quorum,
				ends: this.ends,
				execute: this.execute,
			}),
		) as Types.JSONObject<ProposalQueueStoreData>;
	}

	public toObject() {
		return utils.objects.cloneDeep({
			start: this.start,
			quorum: this.quorum,
			ends: this.ends,
			execute: this.execute,
		} as ProposalQueueStoreData) as ProposalQueueStoreData;
	}

	public async executeQueue() {
		this._checkMutableDependencies();

		for (const startedProposal of this.start) {
			await this._executeStartedProposal(startedProposal);
		}
		for (const proposalQuorumCheck of this.quorum) {
			await this._executeQuorumCheck(proposalQuorumCheck);
		}
		for (const endedProposal of this.ends) {
			await this._executeEndedProposal(endedProposal);
		}
		for (const executedProposal of this.execute) {
			await this._executeProposalOutcome(executedProposal);
		}
	}

	private async _executeStartedProposal(proposalId: number) {
		this._checkMutableDependencies();
		const proposal = await this.proposalStore.getMutableProposal(this.mutableContext!, proposalId);
		await proposal.setStatus(ProposalStatus.ACTIVE);

		const events = this.events.get(ProposalActiveEvent);
		events.add(
			this.mutableContext!.context,
			{
				proposalId,
				status: ProposalStatus.ACTIVE,
			},
			[proposal.author],
		);
	}

	private async _executeQuorumCheck(proposalId: number) {
		this._checkMutableDependencies();

		const proposal = await this.proposalStore.getMutableProposal(this.mutableContext!, proposalId);
		if (proposal.status !== ProposalStatus.ACTIVE) return;

		const stakingTokenId = this._getStakingTokenId();
		const config = await this.config.getConfig(this.mutableContext!.context);
		const totalSupplyStore = await this.tokenMethod!.getTotalSupply(this.mutableContext!.context);
		const index = totalSupplyStore.totalSupply.findIndex(supply => supply.tokenID.equals(stakingTokenId));
		const treshold = parseBigintOrPercentage(proposal.parameters.quorumTreshold, totalSupplyStore.totalSupply[index].totalSupply);

		let participant = BigInt(0);
		let status = ProposalStatus.ACTIVE;

		switch (proposal.parameters.quorumMode) {
			case QuorumMode.FOR_AGAINST_ABSTAIN:
				participant = proposal.turnout.for + proposal.turnout.against + proposal.turnout.abstain;
				break;
			case QuorumMode.FOR_AGAINST:
				participant = proposal.turnout.for + proposal.turnout.against;
				break;
			case QuorumMode.FOR:
				participant = proposal.turnout.for;
				break;
			default:
				throw new Error('unknown proposal.parameters.quorumMode');
		}

		if (participant < treshold) {
			status = ProposalStatus.FAILED_QUORUM;
			await this.tokenMethod!.unlock(this.mutableContext!.context, proposal.author, this.moduleName, stakingTokenId, proposal.deposited);
			await this._removeProposalVoterCastedVote(proposalId);

			if (config.depositPoolAddress) {
				await this.tokenMethod!.transfer(
					this.mutableContext!.context,
					proposal.author,
					cryptography.address.getAddressFromKlayr32Address(config.depositPoolAddress),
					stakingTokenId,
					proposal.deposited,
				);
			} else {
				await this.tokenMethod!.burn(this.mutableContext!.context, proposal.author, stakingTokenId, proposal.deposited);
			}
		}

		await proposal.setStatus(status);

		const events = this.events.get(ProposalQuorumCheckedEvent);
		events.add(
			this.mutableContext!.context,
			{
				proposalId,
				status,
			},
			[proposal.author],
		);
	}

	private async _executeEndedProposal(proposalId: number) {
		this._checkMutableDependencies();

		const proposal = await this.proposalStore.getMutableProposal(this.mutableContext!, proposalId);
		if (proposal.status !== ProposalStatus.ACTIVE) return;

		const stakingTokenId = this._getStakingTokenId();
		await this.tokenMethod!.unlock(this.mutableContext!.context, proposal.author, this.moduleName, stakingTokenId, proposal.deposited);

		let status = ProposalStatus.ACTIVE;
		const totalSupplyStore = await this.tokenMethod!.getTotalSupply(this.mutableContext!.context);
		const index = totalSupplyStore.totalSupply.findIndex(supply => supply.tokenID.equals(stakingTokenId));
		const { totalSupply } = totalSupplyStore.totalSupply[index];

		if (proposal.voteSummary.for > proposal.voteSummary.against) {
			status = ProposalStatus.ACCEPTED;
		}

		if (proposal.parameters.enableTurnoutBias) {
			const participant = proposal.turnout.for + proposal.turnout.against + proposal.turnout.abstain;
			if (!isSatisfyTurnoutBias(proposal.turnout.for, proposal.turnout.against, participant, totalSupply)) {
				status = ProposalStatus.REJECTED;
			}
		}

		await proposal.setStatus(status);
		await this._removeProposalVoterCastedVote(proposalId);

		const events = this.events.get(ProposalOutcomeEvent);
		events.add(
			this.mutableContext!.context,
			{
				proposalId,
				status,
				turnoutBiasEnabled: proposal.parameters.enableTurnoutBias,
				boostingEnabled: proposal.parameters.enableBoosting,
			},
			[proposal.author],
		);
	}

	private async _executeProposalOutcome(proposalId: number) {
		this._checkMutableDependencies();

		const proposal = await this.proposalStore.getMutableProposal(this.mutableContext!, proposalId);
		if (proposal.status !== ProposalStatus.ACCEPTED) return;

		const events = this.events.get(ProposalExecutedEvent);

		// because funding proposal will be very likely to have execution error
		// (because lack of treasury funds, for example)
		// then, funding action will be executed first

		const actions = [...proposal.actions].sort((a, b) => {
			if (a.type === 'funding' && b.type !== 'funding') return -1;
			if (a.type !== 'funding' && b.type === 'funding') return 1;
			return 0;
		});

		try {
			for (const action of actions) {
				if (action.type === 'funding') await this._executeFundingAction(action.payload);
				if (action.type === 'config') await this._executeConfigAction(action.payload);
			}

			await proposal.setStatus(ProposalStatus.EXECUTED);

			events.add(
				this.mutableContext!.context,
				{
					proposalId,
					status: ProposalStatus.EXECUTED,
				},
				[proposal.author],
			);
		} catch {
			await proposal.setStatus(ProposalStatus.EXECUTED_WITH_ERROR);

			events.add(
				this.mutableContext!.context,
				{
					proposalId,
					status: ProposalStatus.EXECUTED_WITH_ERROR,
				},
				[proposal.author],
			);
		}
	}

	private async _executeFundingAction(encodedPayload: Buffer) {
		this._checkMutableDependencies();

		const config = await this.config.getConfig(this.mutableContext!.context);
		const payload = codec.decode<FundingActionPayload>(fundingActionPayloadSchema, encodedPayload);
		await this.tokenMethod!.transfer(
			this.mutableContext!.context,
			cryptography.address.getAddressFromKlayr32Address(config.treasuryAddress),
			payload.receivingAddress,
			payload.tokenId,
			payload.fundingAmount,
		);
	}

	private async _executeConfigAction(encodedPayload: Buffer) {
		this._checkMutableDependencies();

		const payload = codec.decode<ConfigActionPayload>(configActionPayloadSchema, encodedPayload);
		const targetConfig = this.governableConfigRegistry.get(payload.moduleName);
		const decodedValue = decodeConfigProposalValue(targetConfig.schema, payload);
		await targetConfig.setConfigWithPath(this.mutableContext!.context, payload.paramPath, decodedValue);
	}

	private async _removeProposalVoterCastedVote(proposalId: number) {
		this._checkMutableDependencies();
		const proposalVoters = await this.proposalVoterStore.getOrDefault(this.mutableContext!.context, proposalId);
		for (const voter of proposalVoters.voters) {
			await this.castedVoteStore.removeCastedVoteByProposalId(this.mutableContext!.context, voter, proposalId);
		}
	}

	private _getStakingTokenId() {
		return Buffer.concat([Buffer.from(this.genesisConfig.chainID, 'hex'), Buffer.from('00000000', 'hex')]);
	}

	public start: ProposalQueueStoreData['start'] = [];
	public quorum: ProposalQueueStoreData['quorum'] = [];
	public ends: ProposalQueueStoreData['ends'] = [];
	public execute: ProposalQueueStoreData['execute'] = [];

	private readonly castedVoteStore: CastedVoteStore;
	private readonly proposalStore: ProposalStore;
	private readonly governableConfigRegistry: GovernableConfigRegistry;
	private readonly proposalVoterStore: ProposalVoterStore;
}
