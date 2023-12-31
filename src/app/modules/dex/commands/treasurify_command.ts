/* eslint-disable class-methods-use-this */

import {
	BaseCommand,
	CommandVerifyContext,
	CommandExecuteContext,
	VerificationResult,
	VerifyStatus,
} from 'lisk-sdk';
import { verifyTreasurifyParam } from '../utils/verify/params/treasurify';
import { TreasurifyParams } from '../types';
import { treasurifyCommandSchema } from '../schema/commands/treasurify_command';
import { PoolStore } from '../stores/pool';

export class TreasurifyCommand extends BaseCommand {
	// eslint-disable-next-line @typescript-eslint/require-await
	public async verify(
		_context: CommandVerifyContext<TreasurifyParams>,
	): Promise<VerificationResult> {
		try {
			verifyTreasurifyParam(_context.params);
		} catch (error: unknown) {
			return {
				status: VerifyStatus.FAIL,
				error: new Error((error as { message: string }).message),
			};
		}
		return { status: VerifyStatus.OK };
	}

	public async execute(_context: CommandExecuteContext<TreasurifyParams>): Promise<void> {
		const poolStore = this.stores.get(PoolStore);
		await poolStore.releaseTokenToProtocolTreasury(_context, _context.params);
	}

	public schema = treasurifyCommandSchema;
}
