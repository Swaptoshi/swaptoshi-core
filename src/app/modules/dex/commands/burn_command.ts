/* eslint-disable class-methods-use-this */

import { BaseCommand, CommandVerifyContext, CommandExecuteContext, VerificationResult, VerifyStatus } from 'klayr-sdk';
import { PositionManagerStore } from '../stores/position_manager';
import { commandSwapContext } from '../stores/context';
import { burnCommandSchema } from '../schema';
import { BurnParams } from '../types';
import { verifyBurnParam } from '../utils';

export class BurnCommand extends BaseCommand {
	// eslint-disable-next-line @typescript-eslint/require-await
	public async verify(_context: CommandVerifyContext<BurnParams>): Promise<VerificationResult> {
		try {
			verifyBurnParam(_context.params);
		} catch (error: unknown) {
			return {
				status: VerifyStatus.FAIL,
				error: new Error((error as { message: string }).message),
			};
		}
		return { status: VerifyStatus.OK };
	}

	public async execute(_context: CommandExecuteContext<BurnParams>): Promise<void> {
		const positionManagerStore = this.stores.get(PositionManagerStore);
		const context = commandSwapContext(_context);
		const positionManager = await positionManagerStore.getMutablePositionManager(context, _context.params.poolAddress);
		await positionManager.burn(_context.params.tokenId);
	}

	public schema = burnCommandSchema;
}
