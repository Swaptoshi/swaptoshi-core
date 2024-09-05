/* eslint-disable import/no-cycle */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/member-ordering */
import {
	BaseMethod,
	BlockAfterExecuteContext,
	BlockExecuteContext,
	GenesisBlockExecuteContext,
	ImmutableStoreGetter,
	TokenMethod,
	TransactionExecuteContext,
	VerifyStatus,
	codec,
	cryptography,
} from 'klayr-sdk';
import { CONTEXT_STORE_KEY_DYNAMIC_BLOCK_REDUCTION, CONTEXT_STORE_KEY_DYNAMIC_BLOCK_REWARD, POS_MODULE_NAME, POS_STAKE_COMMAND_NAME } from './constants';
import { TreasuryMintEvent } from './events/treasury_mint';
import { TreasuryBlockRewardTaxEvent } from './events/treasury_block_reward_tax';
import { GovernanceGovernableConfig } from './config';
import { GovernableConfigRegistry } from './registry';
import { methodGovernanceContext, mutableBlockHookGovernanceContext } from './stores/context';
import { ProposalQueueStore } from './stores/queue';
import { MutableContext, StakeTransactionParams, VoteScoreOrArray } from './types';
import { stakeCommandParamsSchema } from './schema';
import { DelegatedVoteStore } from './stores/delegated_vote';
import { CastedVoteStore } from './stores/casted_vote';
import { ProposalStore } from './stores/proposal';
import { VoteScoreStore } from './stores/vote_score';
import { BoostedAccountStore } from './stores/boosted_account';
import { parseBigintOrPercentage } from './utils';

interface BlockReward {
	blockReward: bigint;
	reduction: number;
}

export class GovernanceInternalMethod extends BaseMethod {
	private _governableConfig: GovernableConfigRegistry | undefined;
	private _tokenMethod: TokenMethod | undefined;

	public addDependencies(token: TokenMethod, governableConfig: GovernableConfigRegistry) {
		this._tokenMethod = token;
		this._governableConfig = governableConfig;
	}

	// eslint-disable-next-line @typescript-eslint/require-await
	public async updateVoteScoreAfterStake(context: TransactionExecuteContext) {
		if (context.transaction.module === POS_MODULE_NAME && context.transaction.command === POS_STAKE_COMMAND_NAME) {
			let totalAddedStake = BigInt(0);
			let totalSubtractedStake = BigInt(0);

			const stakeParams = codec.decode<StakeTransactionParams>(stakeCommandParamsSchema, context.transaction.params);
			for (const stakes of stakeParams.stakes)
				if (stakes.amount > BigInt(0)) totalAddedStake += stakes.amount;
				else totalSubtractedStake += stakes.amount * BigInt(-1);

			await this.updateProposalVoteSummaryByVoter(context, context.transaction.senderAddress, totalAddedStake, totalSubtractedStake);

			await this.stores.get(VoteScoreStore).addVoteScore(context, context.transaction.senderAddress, totalAddedStake - totalSubtractedStake);
		}
	}

	public async updateProposalVoteSummaryByVoter(
		context: MutableContext,
		voter: Buffer,
		addedVote: VoteScoreOrArray = BigInt(0),
		subtractedVote: VoteScoreOrArray = BigInt(0),
		boostingHeight?: number,
	) {
		const delegatedVoteStore = this.stores.get(DelegatedVoteStore);
		const boostedAccountStore = this.stores.get(BoostedAccountStore);

		const voterBoostingState = await boostedAccountStore.getOrDefault(context, voter);
		const voterBoostingHeight = voterBoostingState.targetHeight;

		const delegatedVote = await delegatedVoteStore.getOrDefault(context, voter);
		if (!delegatedVote.outgoingDelegation.equals(Buffer.alloc(0))) {
			await this.updateProposalVoteSummaryByVoter(context, delegatedVote.outgoingDelegation, addedVote, subtractedVote, boostingHeight ?? voterBoostingHeight);
			return;
		}

		const castedVoteStore = this.stores.get(CastedVoteStore);
		const proposalStore = this.stores.get(ProposalStore);
		const ctx = methodGovernanceContext(context, Buffer.alloc(0), 0);

		const castedVote = await castedVoteStore.getOrDefault(context, voter);

		for (const vote of castedVote.activeVote) {
			if (typeof addedVote === 'bigint' && addedVote > BigInt(0)) {
				await (await proposalStore.getMutableProposal(ctx, vote.proposalId)).addVote(addedVote, vote.decision, boostingHeight ?? voterBoostingHeight);
			}

			if (Array.isArray(addedVote)) {
				for (const addedVoteItem of addedVote) {
					if (addedVoteItem.voteScore > BigInt(0)) {
						await (await proposalStore.getMutableProposal(ctx, vote.proposalId)).addVote(addedVoteItem.voteScore, vote.decision, addedVoteItem.boostingHeight);
					}
				}
			}

			if (typeof subtractedVote === 'bigint' && subtractedVote > BigInt(0)) {
				await (await proposalStore.getMutableProposal(ctx, vote.proposalId)).subtractVote(subtractedVote, vote.decision, boostingHeight ?? voterBoostingHeight);
			}

			if (Array.isArray(subtractedVote)) {
				for (const subtractedVoteItem of subtractedVote) {
					if (subtractedVoteItem.voteScore > BigInt(0)) {
						await (await proposalStore.getMutableProposal(ctx, vote.proposalId)).subtractVote(subtractedVoteItem.voteScore, vote.decision, subtractedVoteItem.boostingHeight);
					}
				}
			}
		}
	}

	public async executeQueuedProposal(context: BlockExecuteContext) {
		const proposalQueueStore = this.stores.get(ProposalQueueStore);
		const ctx = mutableBlockHookGovernanceContext(context);
		const queue = await proposalQueueStore.getInstance(ctx);
		await queue.executeQueue();
	}

	public async initializeGovernableConfig(context: BlockExecuteContext) {
		if (!this._governableConfig) throw new Error('GovernanceInternalMethod dependencies is not configured');

		if (context.header.height === 1) {
			const governableConfigList = this._governableConfig.values();

			for (const governableConfig of governableConfigList) {
				await governableConfig.initRegisteredConfig(context);
			}
		}
	}

	public async verifyGovernableConfig(context: GenesisBlockExecuteContext) {
		if (!this._governableConfig) throw new Error('GovernanceInternalMethod dependencies is not configured');

		const governableConfigList = this._governableConfig.values();

		for (const governableConfig of governableConfigList) {
			if (!governableConfig.initialized) throw new Error(`${governableConfig.name} config not initialized. Call .init() in module.init() if not governable.`);
			if (!governableConfig.genesisConfig) throw new Error(`${governableConfig.name} genesis config is not registered`);

			const verify = await governableConfig.verify({ context, config: governableConfig.default, genesisConfig: governableConfig.genesisConfig });

			if (verify.status !== VerifyStatus.OK) throw new Error(`failed to verify governable config for ${governableConfig.name}: ${verify.error ? verify.error.message : 'unknown'}`);
		}
	}

	public async addTreasuryReward(context: BlockAfterExecuteContext) {
		if (!this._tokenMethod) throw new Error('GovernanceInternalMethod dependencies is not configured');

		const config = await this._getGovernanceConfig(context);
		const dynamicReward = this._getRewardDeduction(context);
		const treasuryAddress = cryptography.address.getAddressFromKlayr32Address(config.treasuryAddress);

		const mintedTreasury = await this._getMintBracket(context, dynamicReward, context.header.height);
		if (mintedTreasury > BigInt(0)) {
			await this._tokenMethod.mint(context, treasuryAddress, Buffer.from(config.treasuryReward.tokenID, 'hex'), mintedTreasury);

			const events = this.events.get(TreasuryMintEvent);
			events.add(context, { amount: mintedTreasury }, [treasuryAddress]);
		}

		const taxedBlockRewardForTreasury = await this._getBlockRewardTaxBracket(context, dynamicReward, context.header.height);
		if (taxedBlockRewardForTreasury > BigInt(0)) {
			await this._tokenMethod.mint(context, treasuryAddress, Buffer.from(config.treasuryReward.tokenID, 'hex'), taxedBlockRewardForTreasury);

			this._setRewardContext(context, dynamicReward.blockReward - taxedBlockRewardForTreasury);

			const events = this.events.get(TreasuryBlockRewardTaxEvent);
			events.add(
				context,
				{
					amount: taxedBlockRewardForTreasury,
					generatorAddress: context.header.generatorAddress,
				},
				[treasuryAddress, context.header.generatorAddress],
			);
		}
	}

	private async _getMintBracket(context: BlockAfterExecuteContext, reward: BlockReward, height: number) {
		const config = await this._getGovernanceConfig(context);
		const bracket = await this._getBracket(context, config.treasuryReward.mintBracket, height);

		if (bracket === '0' || bracket === '0%') return BigInt(0);

		return parseBigintOrPercentage(bracket, reward.blockReward);
	}

	private async _getBlockRewardTaxBracket(context: BlockAfterExecuteContext, reward: BlockReward, height: number) {
		const config = await this._getGovernanceConfig(context);
		const bracket = await this._getBracket(context, config.treasuryReward.blockRewardTaxBracket, height);

		if (bracket === '0' || bracket === '0%') return BigInt(0);

		return parseBigintOrPercentage(bracket, reward.blockReward);
	}

	private _getRewardDeduction(context: BlockAfterExecuteContext): BlockReward {
		const blockReward = context.contextStore.get(CONTEXT_STORE_KEY_DYNAMIC_BLOCK_REWARD) as bigint;
		const reduction = context.contextStore.get(CONTEXT_STORE_KEY_DYNAMIC_BLOCK_REDUCTION) as number;

		return {
			blockReward: blockReward === undefined ? BigInt(0) : blockReward,
			reduction: reduction === undefined ? 0 : reduction,
		};
	}

	private _setRewardContext(context: BlockAfterExecuteContext, updatedReward: bigint) {
		context.contextStore.set(CONTEXT_STORE_KEY_DYNAMIC_BLOCK_REWARD, updatedReward);
	}

	private async _getBracketLocation(context: BlockAfterExecuteContext, height: number): Promise<number> {
		const config = await this._getGovernanceConfig(context);

		if (height < config.treasuryReward.offset) {
			return 0;
		}

		const rewardDistance = Math.floor(config.treasuryReward.distance);
		const location = Math.trunc((height - config.treasuryReward.offset) / rewardDistance);

		return location;
	}

	private async _getBracket(context: BlockAfterExecuteContext, brackets: string[], height: number) {
		if (brackets.length === 0) return '0';

		const location = await this._getBracketLocation(context, height);
		const lastBracket = brackets[brackets.length - 1];

		const bracket = location > brackets.length - 1 ? brackets.lastIndexOf(lastBracket) : location;

		return brackets[bracket];
	}

	private async _getGovernanceConfig(context: ImmutableStoreGetter) {
		const configStore = this.stores.get(GovernanceGovernableConfig);
		return configStore.getConfig(context);
	}
}
