/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/member-ordering */
import { BaseMethod, BlockAfterExecuteContext, TokenMethod, cryptography, validator } from 'klayr-sdk';
import { GovernanceModuleConfig } from './types';
import { CONTEXT_STORE_KEY_DYNAMIC_BLOCK_REDUCTION, CONTEXT_STORE_KEY_DYNAMIC_BLOCK_REWARD } from './constants';
import { configSchema } from './schema';
import { TreasuryMintEvent } from './events/treasury_mint';
import { TreasuryBlockRewardTaxEvent } from './events/treasury_block_reward_tex';

interface BlockReward {
	blockReward: bigint;
	reduction: number;
}

export class GovernanceInternalMethod extends BaseMethod {
	private _config: GovernanceModuleConfig | undefined;
	private _tokenMethod: TokenMethod | undefined;

	public init(moduleConfig: GovernanceModuleConfig) {
		this._config = moduleConfig;
		this._verifyConfig();
	}

	public addDependencies(token: TokenMethod) {
		this._tokenMethod = token;
	}

	public async addTreasuryReward(context: BlockAfterExecuteContext) {
		if (!this._config) throw new Error('GovernanceInternalMethod is not initialized');
		if (!this._tokenMethod) throw new Error('GovernanceInternalMethod dependencies is not configured');

		const dynamicReward = this._getRewardDeduction(context);
		const treasuryAddress = cryptography.address.getAddressFromKlayr32Address(this._config.treasuryAddress);

		const mintedTreasury = this._getMintBracket(dynamicReward, context.header.height);
		if (mintedTreasury > BigInt(0)) {
			await this._tokenMethod.mint(context, treasuryAddress, Buffer.from(this._config.treasuryReward.tokenID, 'hex'), mintedTreasury);

			const events = this.events.get(TreasuryMintEvent);
			events.add(context, { amount: mintedTreasury }, [treasuryAddress]);
		}

		const taxedBlockRewardForTreasury = this._getBlockRewardTaxBracket(dynamicReward, context.header.height);
		if (taxedBlockRewardForTreasury > BigInt(0)) {
			await this._tokenMethod.mint(context, treasuryAddress, Buffer.from(this._config.treasuryReward.tokenID, 'hex'), taxedBlockRewardForTreasury);
			await this._tokenMethod.burn(context, context.header.generatorAddress, Buffer.from(this._config.treasuryReward.tokenID, 'hex'), taxedBlockRewardForTreasury);

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

	private _getMintBracket(reward: BlockReward, height: number) {
		if (!this._config) throw new Error('GovernanceInternalMethod is not initialized');
		const bracket = this._getBracket(this._config.treasuryReward.mintBracket, height);

		if (bracket === '0' || bracket === '0%') return BigInt(0);

		if (bracket.endsWith('%')) {
			return (BigInt(reward.blockReward) * BigInt(bracket.slice(0, bracket.length - 1))) / BigInt(100);
		}
		return BigInt(bracket);
	}

	private _getBlockRewardTaxBracket(reward: BlockReward, height: number) {
		if (!this._config) throw new Error('GovernanceInternalMethod is not initialized');
		const bracket = this._getBracket(this._config.treasuryReward.blockRewardTaxBracket, height);

		if (bracket === '0' || bracket === '0%') return BigInt(0);

		if (bracket.endsWith('%')) {
			return (BigInt(reward.blockReward) * BigInt(bracket.slice(0, bracket.length - 1))) / BigInt(100);
		}
		return BigInt(bracket);
	}

	private _getRewardDeduction(context: BlockAfterExecuteContext): BlockReward {
		const blockReward = context.contextStore.get(CONTEXT_STORE_KEY_DYNAMIC_BLOCK_REWARD) as bigint;
		const reduction = context.contextStore.get(CONTEXT_STORE_KEY_DYNAMIC_BLOCK_REDUCTION) as number;

		return {
			blockReward: blockReward === undefined ? BigInt(0) : blockReward,
			reduction: reduction === undefined ? 0 : reduction,
		};
	}

	private _getBracketLocation(height: number): number {
		if (!this._config) throw new Error('GovernanceInternalMethod is not initialized');

		if (height < this._config.treasuryReward.offset) {
			return 0;
		}

		const rewardDistance = Math.floor(this._config.treasuryReward.distance);
		const location = Math.trunc((height - this._config.treasuryReward.offset) / rewardDistance);

		return location;
	}

	private _getBracket(brackets: string[], height: number) {
		if (!this._config) throw new Error('GovernanceInternalMethod is not initialized');

		if (brackets.length === 0) return '0';

		const location = this._getBracketLocation(height);
		const lastBracket = brackets[brackets.length - 1];

		const bracket = location > brackets.length - 1 ? brackets.lastIndexOf(lastBracket) : location;

		return brackets[bracket];
	}

	private _verifyConfig() {
		validator.validator.validate<GovernanceModuleConfig>(configSchema, this._config);
		cryptography.address.validateKlayr32Address(this._config.treasuryAddress);

		for (const mintBracket of this._config.treasuryReward.mintBracket) {
			if (!this._isValidNonNegativeIntegerOrPercentage(mintBracket)) throw new Error(`Invalid mintBracket: ${mintBracket}`);
		}

		for (const blockRewardTaxBracket of this._config.treasuryReward.blockRewardTaxBracket) {
			if (!this._isValidNonNegativeIntegerOrPercentage(blockRewardTaxBracket)) throw new Error(`Invalid blockRewardTaxBracket: ${blockRewardTaxBracket}`);
		}
	}

	private _isValidNonNegativeIntegerOrPercentage(str: string) {
		// Regular expression to match a valid non-negative integer
		const integerRegex = /^\d+$/;
		// Regular expression to match a valid non-negative integer percentage ending with %
		const percentageRegex = /^\d+%$/;

		return integerRegex.test(str) || percentageRegex.test(str);
	}
}
