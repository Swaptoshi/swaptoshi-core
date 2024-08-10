/* eslint-disable import/no-cycle */
/* eslint-disable @typescript-eslint/member-ordering */
import { GenesisConfig, VerificationResult, VerifyStatus, cryptography, utils } from 'klayr-sdk';
import { BaseGovernableConfig } from './base_governable_config';
import { DEFAULT_MAX_BOOST_DURATION_DAY, DEFAULT_VOTE_DURATION_DAY, defaultConfig } from './constants';
import { configSchema } from './schema';
import { GovernableConfigVerifyContext, GovernanceModuleConfig, QuorumMode } from './types';
import { verifyNumberString, verifyPositiveNumber } from './utils';

export class GovernanceGovernableConfig extends BaseGovernableConfig<GovernanceModuleConfig> {
	public schema = configSchema;
	public default = defaultConfig;

	public beforeConfigInit(genesisConfig: GenesisConfig): void {
		this.default = utils.objects.mergeDeep({}, this.default, {
			voteDuration: (DEFAULT_VOTE_DURATION_DAY * 24 * 3600) / genesisConfig.blockTime,
			quorumDuration: (DEFAULT_VOTE_DURATION_DAY * 24 * 3600) / genesisConfig.blockTime,
			executionDuration: (DEFAULT_VOTE_DURATION_DAY * 24 * 3600) / genesisConfig.blockTime,
			maxBoostDuration: (DEFAULT_MAX_BOOST_DURATION_DAY * 24 * 3600) / genesisConfig.blockTime,
			treasuryReward: { tokenID: `${genesisConfig.chainID}00000000` },
		}) as GovernanceModuleConfig;
	}

	// eslint-disable-next-line @typescript-eslint/require-await
	public async verify(_context: GovernableConfigVerifyContext<GovernanceModuleConfig>): Promise<VerificationResult> {
		try {
			this._verifyConfig(_context.config);
		} catch (error: unknown) {
			return {
				status: VerifyStatus.FAIL,
				error: new Error((error as { message: string }).message),
			};
		}
		return { status: VerifyStatus.OK };
	}

	private _verifyConfig(config: GovernanceModuleConfig) {
		cryptography.address.validateKlayr32Address(config.treasuryAddress);
		cryptography.address.validateKlayr32Address(config.depositPoolAddress);

		if (config.executionDuration < config.voteDuration) {
			throw new Error(`config.excutionDuration can't be lower than config.voteDuration`);
		}

		if (config.voteDuration < config.quorumDuration) {
			throw new Error(`config.voteDuration can't be lower than config.quorumDuration`);
		}

		if (config.quorumDuration < config.votingDelayDuration) {
			throw new Error(`config.quorumDuration can't be lower than config.votingDelayDuration`);
		}

		if (![QuorumMode.FOR, QuorumMode.FOR_AGAINST, QuorumMode.FOR_AGAINST_ABSTAIN].includes(config.quorumMode)) {
			throw new Error(`unknown config.quorumMode`);
		}

		for (const commands of Object.keys(config.minTransactionFee)) {
			verifyNumberString(`config.minTransactionFee.${commands}`, config.minTransactionFee[commands as keyof GovernanceModuleConfig['minTransactionFee']]);
			verifyPositiveNumber(`config.minTransactionFee.${commands}`, config.minTransactionFee[commands as keyof GovernanceModuleConfig['minTransactionFee']]);
		}

		for (const commands of Object.keys(config.baseFee)) {
			verifyNumberString(`config.baseFee.${commands}`, config.baseFee[commands as keyof GovernanceModuleConfig['baseFee']]);
			verifyPositiveNumber(`config.baseFee.${commands}`, config.baseFee[commands as keyof GovernanceModuleConfig['baseFee']]);
		}

		for (const mintBracket of config.treasuryReward.mintBracket) {
			if (!this._isValidNonNegativeIntegerOrPercentage(mintBracket)) throw new Error(`Invalid mintBracket: ${mintBracket}`);
		}

		for (const blockRewardTaxBracket of config.treasuryReward.blockRewardTaxBracket) {
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
