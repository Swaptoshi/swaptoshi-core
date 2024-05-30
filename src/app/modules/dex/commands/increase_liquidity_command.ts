/* eslint-disable class-methods-use-this */

import {
	BaseCommand,
	CommandVerifyContext,
	CommandExecuteContext,
	VerificationResult,
	VerifyStatus,
} from 'klayr-sdk';
import { increaseLiquidityCommandSchema } from '../schema/commands/increase_liquidity_command';
import { PositionManagerStore } from '../stores/position_manager';
import { commandSwapContext } from '../stores/context';
import { IncreaseLiquidityParams } from '../types';
import { verifyIncreaseLiquidityParam } from '../utils/verify';

export class IncreaseLiquidityCommand extends BaseCommand {
	// eslint-disable-next-line @typescript-eslint/require-await
	public async verify(
		_context: CommandVerifyContext<IncreaseLiquidityParams>,
	): Promise<VerificationResult> {
		try {
			verifyIncreaseLiquidityParam(_context.params);
		} catch (error: unknown) {
			return {
				status: VerifyStatus.FAIL,
				error: new Error((error as { message: string }).message),
			};
		}
		return { status: VerifyStatus.OK };
	}

	public async execute(_context: CommandExecuteContext<IncreaseLiquidityParams>): Promise<void> {
		const positionManagerStore = this.stores.get(PositionManagerStore);
		const context = commandSwapContext(_context);
		const positionManager = await positionManagerStore.getMutablePositionManager(
			context,
			_context.params.poolAddress,
		);
		await positionManager.increaseLiquidity(_context.params);
	}

	public schema = increaseLiquidityCommandSchema;
}
