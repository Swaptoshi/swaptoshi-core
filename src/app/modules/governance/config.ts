/* eslint-disable @typescript-eslint/member-ordering */
import { GenesisConfig, VerificationResult, VerifyStatus, cryptography, utils } from 'klayr-sdk';
import { BaseGovernableConfig } from './base_governable_config';
import { defaultConfig } from './constants';
import { configSchema } from './schema';
import { GovernableConfigVerifyContext, GovernanceModuleConfig } from './types';

export class GovernanceGovernableConfig extends BaseGovernableConfig<GovernanceModuleConfig> {
	public schema = configSchema;
	public default = defaultConfig;

	public beforeConfigInit(_genesisConfig: GenesisConfig): void {
		this.default = utils.objects.mergeDeep({}, this.default, { treasuryReward: { tokenID: `${_genesisConfig.chainID}00000000` } }) as GovernanceModuleConfig;
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
