/* eslint-disable @typescript-eslint/member-ordering */
import { GenesisConfig, VerificationResult, VerifyStatus, utils } from 'klayr-sdk';
import { BaseGovernableConfig, GovernableConfigVerifyContext } from '../governance';
import { defaultConfig } from './constants';
import { configSchema } from './schema';
import { LiquidPosModuleConfig } from './types';

export class LiquidPosGovernableConfig extends BaseGovernableConfig<LiquidPosModuleConfig> {
	public schema = configSchema;
	public default = defaultConfig;

	public beforeConfigInit(_genesisConfig: GenesisConfig): void {
		this.default = utils.objects.mergeDeep({}, this.default, { tokenID: `${_genesisConfig.chainID}00000001` }) as LiquidPosModuleConfig;
	}

	// eslint-disable-next-line @typescript-eslint/require-await
	public async verify(_context: GovernableConfigVerifyContext<LiquidPosModuleConfig>): Promise<VerificationResult> {
		try {
			const { tokenID, ratio } = _context.config;
			const { chainID } = _context.genesisConfig;

			if (ratio <= 0) throw new Error('liquid_pos ratio config should be greater than 0');

			if (tokenID.length === 16) {
				if (!tokenID.startsWith(chainID)) throw new Error('invalid liquid_pos tokenID config chainID');
			} else if (tokenID.length !== 8) {
				throw new Error('invalid liquid_pos tokenID config string length');
			}
		} catch (error) {
			return {
				status: VerifyStatus.FAIL,
				error: new Error((error as { message: string }).message),
			};
		}
		return { status: VerifyStatus.OK };
	}
}
