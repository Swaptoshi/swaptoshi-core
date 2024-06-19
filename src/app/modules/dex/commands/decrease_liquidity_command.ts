/* eslint-disable class-methods-use-this */

import { BaseCommand, CommandVerifyContext, CommandExecuteContext, VerificationResult, VerifyStatus } from 'klayr-sdk';
import { PositionManagerStore } from '../stores/position_manager';
import { commandSwapContext } from '../stores/context';
import { decreaseLiquidityCommandSchema } from '../schema';
import { DecreaseLiquidityParams } from '../types';
import { verifyDecreaseLiquidityParam } from '../utils';

export class DecreaseLiquidityCommand extends BaseCommand {
	// eslint-disable-next-line @typescript-eslint/require-await
	public async verify(_context: CommandVerifyContext<DecreaseLiquidityParams>): Promise<VerificationResult> {
		try {
			verifyDecreaseLiquidityParam(_context.params);
		} catch (error: unknown) {
			return {
				status: VerifyStatus.FAIL,
				error: new Error((error as { message: string }).message),
			};
		}
		return { status: VerifyStatus.OK };
	}

	public async execute(_context: CommandExecuteContext<DecreaseLiquidityParams>): Promise<void> {
		const positionManagerStore = this.stores.get(PositionManagerStore);
		const context = commandSwapContext(_context);
		const positionManager = await positionManagerStore.getMutablePositionManager(context, _context.params.poolAddress);
		await positionManager.decreaseLiquidity(_context.params);
	}

	public schema = decreaseLiquidityCommandSchema;
}
