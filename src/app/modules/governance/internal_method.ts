/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/member-ordering */
import { BaseMethod, BlockAfterExecuteContext, BlockExecuteContext, GenesisBlockExecuteContext, ImmutableStoreGetter, TokenMethod, VerifyStatus, cryptography, validator } from 'klayr-sdk';
import { CONTEXT_STORE_KEY_DYNAMIC_BLOCK_REDUCTION, CONTEXT_STORE_KEY_DYNAMIC_BLOCK_REWARD } from './constants';
import { TreasuryMintEvent } from './events/treasury_mint';
import { TreasuryBlockRewardTaxEvent } from './events/treasury_block_reward_tex';
import { GovernanceGovernableConfig } from './config';
import { GovernableConfigRegistry } from './registry';

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

	public async initializeGovernableConfig(context: BlockExecuteContext) {
		if (!this._governableConfig) throw new Error('GovernanceInternalMethod dependencies is not configured');

		if (context.header.height === 1) {
			const governableConfigList = this._governableConfig.values();

			for (const governableConfig of governableConfigList) {
				await governableConfig.initConfig(context);
			}
		}
	}

	public async verifyGovernableConfig(context: GenesisBlockExecuteContext) {
		if (!this._governableConfig) throw new Error('GovernanceInternalMethod dependencies is not configured');

		const governableConfigList = this._governableConfig.values();

		for (const governableConfig of governableConfigList) {
			if (!governableConfig.genesisConfig) throw new Error(`${governableConfig.name} genesis config is not registered`);

			const verify = await governableConfig.verify({ context, config: governableConfig.default, genesisConfig: governableConfig.genesisConfig });

			if (verify.status !== VerifyStatus.OK) throw new Error(`failed to verify governable config for ${governableConfig.name}: ${verify.error ? verify.error.message : 'unknown'}`);
			validator.validator.validate(governableConfig.schema, governableConfig.default);
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
			await this._tokenMethod.burn(context, context.header.generatorAddress, Buffer.from(config.treasuryReward.tokenID, 'hex'), taxedBlockRewardForTreasury);

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

		if (bracket.endsWith('%')) {
			return (BigInt(reward.blockReward) * BigInt(bracket.slice(0, bracket.length - 1))) / BigInt(100);
		}
		return BigInt(bracket);
	}

	private async _getBlockRewardTaxBracket(context: BlockAfterExecuteContext, reward: BlockReward, height: number) {
		const config = await this._getGovernanceConfig(context);
		const bracket = await this._getBracket(context, config.treasuryReward.blockRewardTaxBracket, height);

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
