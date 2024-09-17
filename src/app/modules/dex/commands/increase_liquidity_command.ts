/* eslint-disable class-methods-use-this */

import { Modules, StateMachine } from 'klayr-sdk';
import { increaseLiquidityCommandSchema } from '../schema';
import { PositionManagerStore } from '../stores/position_manager';
import { commandSwapContext } from '../stores/context';
import { IncreaseLiquidityParams } from '../types';
import { verifyIncreaseLiquidityParam } from '../utils';

export class IncreaseLiquidityCommand extends Modules.BaseCommand {
	// eslint-disable-next-line @typescript-eslint/require-await
	public async verify(_context: StateMachine.CommandVerifyContext<IncreaseLiquidityParams>): Promise<StateMachine.VerificationResult> {
		try {
			verifyIncreaseLiquidityParam(_context.params);
		} catch (error: unknown) {
			return {
				status: StateMachine.VerifyStatus.FAIL,
				error: new Error((error as { message: string }).message),
			};
		}
		return { status: StateMachine.VerifyStatus.OK };
	}

	public async execute(_context: StateMachine.CommandExecuteContext<IncreaseLiquidityParams>): Promise<void> {
		const positionManagerStore = this.stores.get(PositionManagerStore);
		const context = commandSwapContext(_context);
		const positionManager = await positionManagerStore.getMutablePositionManager(context, _context.params.poolAddress);
		await positionManager.increaseLiquidity(_context.params);
	}

	public schema = increaseLiquidityCommandSchema;
}
