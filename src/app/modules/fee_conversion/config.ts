/* eslint-disable @typescript-eslint/member-ordering */
import { VerificationResult, VerifyStatus } from 'klayr-sdk';
import { BaseGovernableConfig, GovernableConfigVerifyContext } from '../governance';
import { FeeConversionModuleConfig } from './types';
import { configSchema } from './schema';
import { PATH_MINIMUM_LENGTH, PATH_OFFSET_LENGTH, TOKEN_ID_LENGTH, defaultConfig } from './constants';

export class FeeConversionGovernableConfig extends BaseGovernableConfig<FeeConversionModuleConfig> {
	public schema = configSchema;
	public default = defaultConfig;

	// eslint-disable-next-line @typescript-eslint/require-await
	public async verify(_context: GovernableConfigVerifyContext<FeeConversionModuleConfig>): Promise<VerificationResult> {
		try {
			const { chainID } = _context.genesisConfig;

			for (const path of _context.config.conversionPath) {
				const tokenOut = path.substring(0, TOKEN_ID_LENGTH * 2);

				if (tokenOut !== `${chainID}00000000`) {
					throw new Error(`invalid conversion path: ${path}, path needs to starts with native token as tokenOut`);
				}

				if (path.length < PATH_MINIMUM_LENGTH * 2) {
					throw new Error(`invalid conversion path: ${path}, path should have minimum ${PATH_MINIMUM_LENGTH * 2} character (${PATH_MINIMUM_LENGTH} bytes)`);
				}

				if (path.length > PATH_MINIMUM_LENGTH * 2 && (path.length - PATH_MINIMUM_LENGTH * 2) % (PATH_OFFSET_LENGTH * 2) !== 0) {
					throw new Error(`invalid conversion path: ${path}, path should have valid offset of ${PATH_OFFSET_LENGTH * 2} character (${PATH_OFFSET_LENGTH} bytes)`);
				}
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
