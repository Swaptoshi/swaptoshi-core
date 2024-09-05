/* eslint-disable import/no-cycle */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { GenesisConfig, JSONObject, NamedRegistry, TransactionVerifyContext, codec, utils } from 'klayr-sdk';
import { BoostVoteParams, BoostedAccountStoreData, StakeTransactionParams } from '../../types';
import { BaseInstance } from './base';
import { GovernanceGovernableConfig } from '../../config';
import { serializer } from '../../utils';
import { BoostedAccountStore } from '../boosted_account';
import { POS_MODULE_NAME, POS_STAKE_COMMAND_NAME } from '../../constants';
import { stakeCommandParamsSchema } from '../../schema';
import { VoteBoostedEvent } from '../../events/vote_boosted';
import { CastedVoteStore } from '../casted_vote';
import { VoteScoreStore } from '../vote_score';

export class BoostedAccount extends BaseInstance<BoostedAccountStoreData, BoostedAccountStore> implements BoostedAccountStoreData {
	public constructor(
		stores: NamedRegistry,
		events: NamedRegistry,
		config: GovernanceGovernableConfig,
		genesisConfig: GenesisConfig,
		moduleName: string,
		boostedAccount: BoostedAccountStoreData,
		address: Buffer,
	) {
		super(BoostedAccountStore, stores, events, config, genesisConfig, moduleName, address);

		Object.assign(this, utils.objects.cloneDeep(boostedAccount));

		this.castedVoteStore = stores.get(CastedVoteStore);
		this.voteScoreStore = stores.get(VoteScoreStore);
	}

	public toJSON() {
		return utils.objects.cloneDeep(
			serializer<BoostedAccountStoreData>({
				targetHeight: this.targetHeight,
			}),
		) as JSONObject<BoostedAccountStoreData>;
	}

	public toObject() {
		return utils.objects.cloneDeep({
			targetHeight: this.targetHeight,
		} as BoostedAccountStoreData) as BoostedAccountStoreData;
	}

	public async verifyBoostVote(params: BoostVoteParams) {
		this._checkImmutableDependencies();

		const config = await this.getConfig(this.immutableContext!.context);

		if (!config.enableBoosting) {
			throw new Error(`boosting is disabled in the governance configuration`);
		}

		if (params.targetHeight <= 0) {
			throw new Error('params.targetHeight needs to be larger than 0');
		}

		if (params.targetHeight > config.maxBoostDuration) {
			throw new Error(`params.targetHeight exceeds maximum boosting duration of ${config.maxBoostDuration}`);
		}

		if (this.targetHeight !== 0 && this.immutableContext!.height < this.targetHeight) {
			throw new Error(`sender currently still in boosting period until height ${this.targetHeight}`);
		}
	}

	public async boostVote(params: BoostVoteParams, verify = true) {
		this._checkMutableDependencies();
		if (!this.internalMethod) throw new Error(`boostedVote instance is created without internalMethod dependencies`);

		if (verify) await this.verifyBoostVote(params);

		await this._removeSenderVoteFromProposal();

		this.targetHeight = params.targetHeight;

		await this._saveStore();

		await this.castedVoteStore.setAllCastedVoteBoostingHeight(this.mutableContext!.context, this.mutableContext!.senderAddress, params.targetHeight);

		await this._addSenderVoteToProposal();

		const events = this.events.get(VoteBoostedEvent);
		events.add(
			this.mutableContext!.context,
			{
				address: this.mutableContext!.senderAddress,
				targetHeight: params.targetHeight,
			},
			[this.mutableContext!.senderAddress],
		);
	}

	public async isValidUnstake() {
		this._checkImmutableDependencies();

		const config = await this.getConfig(this.immutableContext!.context);
		if (!config.enableBoosting) return;

		const { context } = this.immutableContext! as { context: TransactionVerifyContext };

		if (context.transaction.module === POS_MODULE_NAME && context.transaction.command === POS_STAKE_COMMAND_NAME) {
			let isDownStaking = false;

			const stakeParams = codec.decode<StakeTransactionParams>(stakeCommandParamsSchema, context.transaction.params);
			for (const stakes of stakeParams.stakes) {
				if (stakes.amount < BigInt(0)) {
					isDownStaking = true;
					break;
				}
			}

			if (isDownStaking && context.header.height < this.targetHeight) throw new Error(`Unstake Failed: Staker still in governance boosted period until height ${this.targetHeight}`);
		}
	}

	private async _removeSenderVoteFromProposal() {
		this._checkMutableDependencies();
		if (!this.internalMethod) throw new Error(`delegatedVote instance is created without internalMethod dependencies`);

		const voteScore = await this.voteScoreStore.getVoteScore(this.mutableContext!.context, this.mutableContext!.senderAddress);
		await this.internalMethod.updateProposalVoteSummaryByVoter(this.mutableContext!.context, this.mutableContext!.senderAddress, BigInt(0), voteScore);
	}

	private async _addSenderVoteToProposal() {
		this._checkMutableDependencies();
		if (!this.internalMethod) throw new Error(`delegatedVote instance is created without internalMethod dependencies`);

		const voteScore = await this.voteScoreStore.getVoteScore(this.mutableContext!.context, this.mutableContext!.senderAddress);
		await this.internalMethod.updateProposalVoteSummaryByVoter(this.mutableContext!.context, this.mutableContext!.senderAddress, voteScore, BigInt(0));
	}

	public targetHeight: BoostedAccountStoreData['targetHeight'] = 0;

	private readonly castedVoteStore: CastedVoteStore;
	private readonly voteScoreStore: VoteScoreStore;
}
